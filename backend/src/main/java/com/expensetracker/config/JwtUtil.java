package com.expensetracker.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

@Component
public class JwtUtil {
    private final long EXPIRATION = 86400000; // 1 day

    @Value("${security.jwt.secret:MySuperSecureJWTKey@1234567890ABCDEF}")
    private String secretValue; // injected from application properties / env

    private SecretKey cachedKey;

    private SecretKey key() {
        // Lazy build; if secret rotates during runtime you could reset cachedKey via a refresh hook.
        if (cachedKey == null) {
            if (secretValue == null || secretValue.isBlank()) {
                throw new IllegalStateException("JWT secret not configured (security.jwt.secret). Set env JWT_SECRET or property.");
            }
            if (secretValue.length() < 32) { // HS256 needs enough entropy
                throw new IllegalStateException("JWT secret too short; must be at least 32 characters for HS256 strength.");
            }
            cachedKey = Keys.hmacShaKeyFor(secretValue.getBytes(StandardCharsets.UTF_8));
        }
        return cachedKey;
    }

    public String generateToken(String username) {
    return Jwts.builder()
                .setSubject(username)
                .claim("username", username) // custom claim
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
        .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token, String username) {
        return extractUsername(token).equals(username) && !isTokenExpired(token);
    }

    private Claims getClaims(String token) {
    return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody();
    }


    private boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }
}
