package com.expensetracker.service;

import com.expensetracker.dto.ForecastDto;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ForecastCache {
    private static class Entry { ForecastDto dto; Instant ts; Entry(ForecastDto d){this.dto=d; this.ts=Instant.now();} }
    private final Map<String, Entry> cache = new ConcurrentHashMap<>();
    private static final long TTL_MS = 60_000; // 1 minute

    private String key(Long userId, int futureMonths){ return userId+":"+futureMonths; }

    public ForecastDto get(Long userId, int futureMonths){
        Entry e = cache.get(key(userId,futureMonths));
        if(e==null) return null;
        if(Instant.now().toEpochMilli() - e.ts.toEpochMilli() > TTL_MS){ cache.remove(key(userId,futureMonths)); return null; }
        return e.dto;
    }
    public void put(Long userId, int futureMonths, ForecastDto dto){ cache.put(key(userId,futureMonths), new Entry(dto)); }
    public void invalidateUser(Long userId){ cache.keySet().removeIf(k -> k.startsWith(userId+":")); }
}