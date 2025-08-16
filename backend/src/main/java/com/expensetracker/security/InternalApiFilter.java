package com.expensetracker.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

/** Simple header token filter for internal service-to-service calls (e.g., AWS Lambdas). */
@Component
@Order(5)
public class InternalApiFilter implements Filter {
    @Value("${internal.api.token:}")
    private String internalToken;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        String path = req.getRequestURI();
        if (path.startsWith("/internal/")) {
            String provided = req.getHeader("X-Internal-Token");
            if (internalToken == null || internalToken.isEmpty() || !internalToken.equals(provided)) {
                res.setStatus(401);
                res.getWriter().write("Unauthorized internal call");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
