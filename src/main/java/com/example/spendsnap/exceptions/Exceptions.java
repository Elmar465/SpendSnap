package com.example.spendsnap.exceptions;


import org.apache.catalina.connector.Response;
import org.hibernate.resource.transaction.backend.jta.internal.synchronization.ExceptionMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Collections;

@ControllerAdvice
public class Exceptions {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception e){
        // Log the exception
        return new ResponseEntity<>("An error occured" + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<String> handleUsernameNotFoundException(UsernameNotFoundException e){
        return new ResponseEntity<>("Username not found" + e.getMessage(), HttpStatus.NOT_FOUND);
    }

}
