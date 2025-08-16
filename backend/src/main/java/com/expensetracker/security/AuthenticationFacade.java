package com.expensetracker.security;

import com.expensetracker.model.User;

public interface AuthenticationFacade {
    User currentUser();
}
