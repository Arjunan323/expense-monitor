package com.expensetracker.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.expensetracker.repository.UserRepository;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void deleteUserByEmail(String email) {
        userRepository.deleteByEmail(email);
    }
}
