package com.example.spendsnap.controller;


import com.example.spendsnap.dto.ExpenseDto;
import com.example.spendsnap.model.Expenses;
import com.example.spendsnap.model.UserModel;
import com.example.spendsnap.service.ExpensesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import static com.example.spendsnap.service.ExpensesService.toDto;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpensesController {

    private final ExpensesService expensesService;



    @PostMapping("/addExpenses")
    public ResponseEntity<ExpenseDto> addExpenses(@RequestBody Expenses expenses) {
        Expenses expenses1 =expensesService.addExpenses(expenses);
        ExpenseDto expenseDtoDto = toDto(expenses1);
        return new  ResponseEntity<>(expenseDtoDto, HttpStatus.CREATED);
    }

    @PutMapping("/update")
    public ResponseEntity<ExpenseDto> updateExpenses(@RequestBody Expenses expenses) {
        Expenses updatedExpenses = expensesService.updateExpenses(expenses);
        ExpenseDto expenseDtoDto = toDto(updatedExpenses);
        return new  ResponseEntity<>(expenseDtoDto, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteExpenses(@PathVariable Integer id) {
            expensesService.deleteExpenses(id);
    }


    @GetMapping("/getExpenseByUser/{id}")
    public ResponseEntity<List<ExpenseDto>> getExpensesByUser(@PathVariable Integer id) {
        List<Expenses> getDetails = expensesService.getExpensesByUser(id);
        List<ExpenseDto> expenseDtops = getDetails.stream()
                .map(ExpensesService::toDto)
                .toList();
        return new   ResponseEntity<>(expenseDtops, HttpStatus.OK);
    }

    @GetMapping("/getExpensesById/{id}")
    public ResponseEntity<ExpenseDto> getExpensesById(@PathVariable Integer id) {
        Expenses getDetails = expensesService.getExpensesById(id);
        ExpenseDto expenseDto = toDto((Expenses) getDetails);
        return new  ResponseEntity<>(expenseDto, HttpStatus.OK);
    }
}
