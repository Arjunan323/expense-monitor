package com.expensetracker.stream;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SpendingAlertStreamPublisher {
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ObjectMapper mapper = new ObjectMapper();

    public SseEmitter register(){
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        emitters.add(emitter);
        emitter.onCompletion(()-> emitters.remove(emitter));
        emitter.onTimeout(()-> emitters.remove(emitter));
        emitter.onError(e-> emitters.remove(emitter));
        return emitter;
    }

    public void publish(String event, Object payload){
        emitters.forEach(emitter -> {
            try {
                SseEmitter.SseEventBuilder eb = SseEmitter.event().name(event).data(mapper.writeValueAsString(payload));
                emitter.send(eb);
            } catch (IOException e) {
                emitter.complete();
                emitters.remove(emitter);
            }
        });
    }
}
