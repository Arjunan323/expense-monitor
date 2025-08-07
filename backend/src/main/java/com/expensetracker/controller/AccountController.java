package com.expensetracker.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.expensetracker.services.UserService;

@RestController
@RequestMapping("/user")
public class AccountController {

    @Autowired
    private UserService userService;

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@AuthenticationPrincipal UserDetails userDetails) {
        userService.deleteUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
