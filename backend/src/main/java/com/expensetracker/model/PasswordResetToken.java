package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false, unique = true, length = 64)
    private String token;
    @Column(nullable = false)
    private Instant expiresAt;
    @Column(nullable = false)
    private boolean consumed = false;
    public static PasswordResetToken create(User u, long ttlSeconds){
        PasswordResetToken t = new PasswordResetToken();
        t.user=u; t.token= UUID.randomUUID().toString().replace("-"," ").trim().replace(" ","");
        t.expiresAt = Instant.now().plusSeconds(ttlSeconds);
        return t;
    }
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public User getUser(){return user;} public void setUser(User user){this.user=user;}
    public String getToken(){return token;} public void setToken(String token){this.token=token;}
    public Instant getExpiresAt(){return expiresAt;} public void setExpiresAt(Instant expiresAt){this.expiresAt=expiresAt;}
    public boolean isConsumed(){return consumed;} public void setConsumed(boolean consumed){this.consumed=consumed;}
    public boolean isExpired(){ return Instant.now().isAfter(expiresAt); }
}
