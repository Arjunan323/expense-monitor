package com.expensetracker.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public Caffeine<Object,Object> caffeineSpec() {
        return Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(10_000);
    }

    @Bean
    public CacheManager cacheManager(Caffeine<Object,Object> caffeine) {
        SimpleCacheManager mgr = new SimpleCacheManager();
        mgr.setCaches(List.of(
                new CaffeineCache("analytics:summary", caffeine.build()),
                new CaffeineCache("plans:byTypeCurrency", caffeine.build()),
                new CaffeineCache("plans:all", caffeine.build())
        ));
        return mgr;
    }
}
