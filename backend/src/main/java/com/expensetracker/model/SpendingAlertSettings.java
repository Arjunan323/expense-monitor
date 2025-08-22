package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "spending_alert_settings")
public class SpendingAlertSettings {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    private double largeMultiplier = 1.5;
    private double largeMinAmount = 0;
    private int freqWindowHours = 48;
    private int freqMaxTxn = 4;
    private double freqMinAmount = 0;
    private double catSpikeMultiplier = 2.0;
    private int catSpikeLookbackMonths = 3;
    private double catSpikeMinAmount = 0;
    private double newMerchantMinAmount = 0;
    // Additional nuanced severity thresholds
    private Double criticalLargeAbsolute; // override absolute threshold for large txn
    private Double criticalCategorySpikeMultiplier; // override spike multiplier
    private Integer criticalFrequencyCount; // frequency escalation count
    private Double criticalNewMerchantAbsolute; // new merchant critical amount
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Tracking of last automated generation
    private LocalDateTime lastGeneratedAt;
    private Long lastGeneratedCount;
    @PrePersist public void prePersist(){ createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate public void preUpdate(){ updatedAt = LocalDateTime.now(); }
    // getters/setters
    public Long getId(){ return id; }
    public void setId(Long id){ this.id=id; }
    public User getUser(){ return user; }
    public void setUser(User user){ this.user=user; }
    public double getLargeMultiplier(){ return largeMultiplier; }
    public void setLargeMultiplier(double v){ this.largeMultiplier=v; }
    public double getLargeMinAmount(){ return largeMinAmount; }
    public void setLargeMinAmount(double v){ this.largeMinAmount=v; }
    public int getFreqWindowHours(){ return freqWindowHours; }
    public void setFreqWindowHours(int v){ this.freqWindowHours=v; }
    public int getFreqMaxTxn(){ return freqMaxTxn; }
    public void setFreqMaxTxn(int v){ this.freqMaxTxn=v; }
    public double getFreqMinAmount(){ return freqMinAmount; }
    public void setFreqMinAmount(double v){ this.freqMinAmount=v; }
    public double getCatSpikeMultiplier(){ return catSpikeMultiplier; }
    public void setCatSpikeMultiplier(double v){ this.catSpikeMultiplier=v; }
    public int getCatSpikeLookbackMonths(){ return catSpikeLookbackMonths; }
    public void setCatSpikeLookbackMonths(int v){ this.catSpikeLookbackMonths=v; }
    public double getCatSpikeMinAmount(){ return catSpikeMinAmount; }
    public void setCatSpikeMinAmount(double v){ this.catSpikeMinAmount=v; }
    public double getNewMerchantMinAmount(){ return newMerchantMinAmount; }
    public void setNewMerchantMinAmount(double v){ this.newMerchantMinAmount=v; }
    public Double getCriticalLargeAbsolute(){ return criticalLargeAbsolute; }
    public void setCriticalLargeAbsolute(Double v){ this.criticalLargeAbsolute=v; }
    public Double getCriticalCategorySpikeMultiplier(){ return criticalCategorySpikeMultiplier; }
    public void setCriticalCategorySpikeMultiplier(Double v){ this.criticalCategorySpikeMultiplier=v; }
    public Integer getCriticalFrequencyCount(){ return criticalFrequencyCount; }
    public void setCriticalFrequencyCount(Integer v){ this.criticalFrequencyCount=v; }
    public Double getCriticalNewMerchantAbsolute(){ return criticalNewMerchantAbsolute; }
    public void setCriticalNewMerchantAbsolute(Double v){ this.criticalNewMerchantAbsolute=v; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
    public LocalDateTime getUpdatedAt(){ return updatedAt; }
    public LocalDateTime getLastGeneratedAt(){ return lastGeneratedAt; }
    public void setLastGeneratedAt(LocalDateTime v){ this.lastGeneratedAt=v; }
    public Long getLastGeneratedCount(){ return lastGeneratedCount; }
    public void setLastGeneratedCount(Long v){ this.lastGeneratedCount=v; }
}
