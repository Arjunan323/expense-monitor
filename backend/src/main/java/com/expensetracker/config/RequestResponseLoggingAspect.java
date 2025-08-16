package com.expensetracker.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.IntStream;

@Aspect
@Component
public class RequestResponseLoggingAspect {

    private static final Logger log = LoggerFactory.getLogger("HTTP");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.http.logging.enabled:true}")
    private boolean httpLogging;
    private static final Set<String> SENSITIVE_KEYS = Set.of(
            "password", "pass", "pwd", "token", "accessToken", "refreshToken", "authorization", "auth", "secret", "apiKey", "api_key", "email"
    );

    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    public Object logAround(ProceedingJoinPoint pjp) throws Throwable {
    if (!httpLogging) return pjp.proceed();
    Instant start = Instant.now();
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        String controller = signature.getDeclaringType().getSimpleName();
        String method = signature.getMethod().getName();

        HttpServletRequest request = currentRequest();
        HttpServletResponse response = currentResponse();
        String correlationId = correlationId(request);
        MDC.put("correlationId", correlationId);

        String httpMethod = request != null ? request.getMethod() : "N/A";
        String path = request != null ? request.getRequestURI() : "N/A";

        Map<String, Object> requestMeta = new HashMap<>();
        requestMeta.put("controller", controller);
        requestMeta.put("method", method);
        requestMeta.put("httpMethod", httpMethod);
        requestMeta.put("path", path);
        requestMeta.put("correlationId", correlationId);
        requestMeta.put("args", argsMap(signature.getParameterNames(), pjp.getArgs()));

        try {
            log.info("request: {}", toJsonSafe(requestMeta));
            Object result = pjp.proceed();
            Duration duration = Duration.between(start, Instant.now());
            Map<String, Object> responseMeta = new HashMap<>();
            responseMeta.put("controller", controller);
            responseMeta.put("method", method);
            responseMeta.put("durationMs", duration.toMillis());
            responseMeta.put("correlationId", correlationId);
            // Avoid deep serialization / recursion for streaming responses
            if (result instanceof SseEmitter) {
                responseMeta.put("resultType", "SseEmitter");
                responseMeta.put("body", "<stream>");
                if (response != null) response.setHeader("X-Correlation-Id", correlationId);
                log.info("response: {}", toJsonSafe(responseMeta));
                return result;
            }
            if (result instanceof ResponseEntity<?> re) {
                responseMeta.put("status", re.getStatusCode().value());
                responseMeta.put("body", summarize(re.getBody()));
                if (response != null) response.setHeader("X-Correlation-Id", correlationId);
                log.info("response: {}", toJsonSafe(responseMeta));
                return re;
            } else {
                responseMeta.put("resultType", result != null ? result.getClass().getSimpleName() : "null");
                responseMeta.put("body", summarize(result));
                if (response != null) response.setHeader("X-Correlation-Id", correlationId);
                log.info("response: {}", toJsonSafe(responseMeta));
                return result;
            }
        } catch (Throwable ex) {
            Duration duration = Duration.between(start, Instant.now());
            Map<String, Object> errorMeta = new HashMap<>();
            errorMeta.put("controller", controller);
            errorMeta.put("method", method);
            errorMeta.put("durationMs", duration.toMillis());
            errorMeta.put("error", ex.getClass().getSimpleName());
            errorMeta.put("message", ex.getMessage());
            errorMeta.put("correlationId", correlationId);
            log.warn("exception: {}", toJsonSafe(errorMeta));
            throw ex;
        } finally {
            MDC.remove("correlationId");
        }
    }

    private HttpServletRequest currentRequest() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest();
        }
        return null;
    }

    private HttpServletResponse currentResponse() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getResponse();
        }
        return null;
    }

    private String correlationId(HttpServletRequest req) {
        if (req == null) return UUID.randomUUID().toString();
        String existing = req.getHeader("X-Correlation-Id");
        return (existing == null || existing.isBlank()) ? UUID.randomUUID().toString() : existing;
    }

    private Map<String, Object> argsMap(String[] names, Object[] values) {
        Map<String, Object> map = new HashMap<>();
        if (names == null) return map;
        IntStream.range(0, names.length).forEach(i -> {
            Object v = i < values.length ? values[i] : null;
            map.put(names[i], summarize(v));
        });
        return map;
    }

    private Object summarize(Object v) {
        if (v == null) return null;
        String cls = v.getClass().getName();
        if (v instanceof byte[] bytes) {
            return "byte[" + bytes.length + "]";
        }
        if (cls.contains("jakarta.servlet") || cls.contains("org.springframework.http.server")) {
            return cls;
        }
        // Prevent deep/recursive serialization of JPA entities & large graphs that can cause StackOverflowError
        try {
            // JPA Entity detection
            if (v.getClass().getAnnotation(jakarta.persistence.Entity.class) != null) {
                return entitySummary(v);
            }
            // Collections / arrays / maps: summarize elements
            if (v instanceof Collection<?> col) {
                int max = Math.min(col.size(), 10); // cap size
                java.util.List<Object> list = new java.util.ArrayList<>(max);
                int i = 0; for (Object o : col) { if (i++ >= max) break; list.add(summarize(o)); }
                if (col.size() > max) list.add("..." + (col.size() - max) + " more");
                return list;
            }
            if (v instanceof Map<?,?> map) {
                java.util.Map<Object,Object> out = new java.util.LinkedHashMap<>();
                int i = 0; int max = 10;
                for (var e : map.entrySet()) { if (i++ >= max) break; out.put(e.getKey(), summarize(e.getValue())); }
                if (map.size() > max) out.put("_truncated", (map.size()-max) + " more entries");
                return out;
            }
            if (v.getClass().isArray()) {
                int len = java.lang.reflect.Array.getLength(v);
                int max = Math.min(len, 10);
                java.util.List<Object> list = new java.util.ArrayList<>(max + (len > max ? 1 : 0));
                for (int i=0;i<max;i++) list.add(summarize(java.lang.reflect.Array.get(v,i)));
                if (len > max) list.add("..." + (len - max) + " more");
                return list;
            }
        } catch (Throwable ignore) {
            // Fallback to normal path if any issue summarizing
        }
        String json = toJsonSafe(v);
        json = maskJson(json);
        if (json.length() > 1000) {
            return json.substring(0, 1000) + "...";
        }
        return json;
    }

    private Map<String,Object> entitySummary(Object entity) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("_entity", entity.getClass().getSimpleName());
        // Try to extract @Id fields or common id naming
        java.lang.reflect.Field[] fields = entity.getClass().getDeclaredFields();
        for (java.lang.reflect.Field f : fields) {
            try {
                if (f.getAnnotation(jakarta.persistence.Transient.class) != null) continue;
                boolean idLike = f.getAnnotation(jakarta.persistence.Id.class) != null || f.getName().equalsIgnoreCase("id") || f.getName().endsWith("Id");
                if (idLike) {
                    f.setAccessible(true);
                    Object val = f.get(entity);
                    m.put(f.getName(), val);
                }
                // Include a few timestamp fields for context
                if (f.getType().getName().equals("java.time.LocalDateTime") && (f.getName().endsWith("At") || f.getName().endsWith("Date"))) {
                    f.setAccessible(true);
                    Object val = f.get(entity);
                    if (val != null) m.put(f.getName(), val.toString());
                }
            } catch (Throwable ignored) { }
        }
        return m;
    }

    private String toJsonSafe(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }

    private String maskJson(String json) {
        if (json == null || json.isEmpty()) return json;
        Pattern p = Pattern.compile("\\\"(.*?)\\\"\\s*:\\s*\\\"(.*?)\\\"");
        Matcher m = p.matcher(json);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String key = m.group(1);
            String value = m.group(2);
            if (isSensitive(key)) {
                String masked = maskValue(key, value);
                m.appendReplacement(sb, Matcher.quoteReplacement("\"" + key + "\":\"" + masked + "\""));
            }
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private boolean isSensitive(String key) {
        if (key == null) return false;
        String k = key.toLowerCase();
        return SENSITIVE_KEYS.stream().anyMatch(s -> k.equals(s.toLowerCase()));
    }

    private String maskValue(String key, String value) {
        if (value == null) return null;
        if (key.equalsIgnoreCase("email")) {
            int at = value.indexOf('@');
            if (at > 2) {
                return value.substring(0, 2) + "***" + value.substring(at);
            }
            return "***" + (at >= 0 ? value.substring(at) : "");
        }
        if (value.length() <= 4) return "****";
        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
    }
}
