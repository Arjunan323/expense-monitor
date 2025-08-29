package com.expensetracker.dto;

public record GenericKeyValue<K,V>(K key, V value) {}