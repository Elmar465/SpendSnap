package com.example.spendsnap.service;


import com.example.spendsnap.dao.ExpensesDao;
import com.example.spendsnap.dao.UserDao;
import com.example.spendsnap.dto.ExpenseDto;
import com.example.spendsnap.model.Expenses;
import com.example.spendsnap.model.UserModel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpensesService {

    private final ExpensesDao expensesDao;
    private final UserDao  userDao;
    private final UserService userService;

    public ExpenseDto addExpenseFromDto(ExpenseDto expenseDto) {
        UserModel user = userService.findUserById(expenseDto.getUserId());
        Expenses expenses = new Expenses(
                null,
                expenseDto.getAmount(),
                expenseDto.getDescription(),
                expenseDto.getDate(),
                expenseDto.getCategory(),
                user
        );
        Expenses saved = expensesDao.save(expenses);
        return toDto(saved);
    }
    public Expenses updateExpenses(Expenses expenses) {
        Expenses oldExpenses = expensesDao.findById(expenses.getId()).orElse(new Expenses());
        oldExpenses.setAmount(expenses.getAmount());
        oldExpenses.setDescription(expenses.getDescription());
        return  expensesDao.save(oldExpenses);
    }

    public void deleteExpenses(Integer id) {
        expensesDao.deleteById(id);

    }

    public List<Expenses> getExpensesByUser(Integer userId) {
        UserModel user = userDao.findById(userId).orElse(null); // Or throw an exception if not found
        if (user == null) {
            return Collections.emptyList(); // or handle error
        }
        return expensesDao.findByUser(user);
    }

    public Expenses getExpensesById(Integer id) {

        return expensesDao.findById(id).orElse(new Expenses());
    }

    public Double getTotalExpensesByUser(Integer userId) {
        UserModel user = userDao.findById(userId).orElse(null);
        if (user == null) {
            return 0.0;
        }
        return expensesDao.getTotalExpensesByUser(userId);
    }

    public Double getMonthlyExpensesSumByUser(Integer userId, int month, int year) {
        UserModel user = userDao.findById(userId).orElse(null);
        if (user == null) {
            return 0.0;
        }
        return expensesDao.getMonthlyExpensesSumByUser(userId, month, year);
    }

    public List<Expenses> getMonthlyExpensesByUser(Integer userId, int month, int year) {
        UserModel user = userDao.findById(userId).orElse(null);
        if (user == null) {
            return Collections.emptyList();
        }
        return expensesDao.getMonthlyExpensesByUser(userId, month, year);
    }

    public static  ExpenseDto toDto(Expenses expenses) {
        ExpenseDto expenseDto = new ExpenseDto();
        expenseDto.setId(expenses.getId());
        expenseDto.setAmount(expenses.getAmount());
        expenseDto.setDescription(expenses.getDescription());
        expenseDto.setDate(expenses.getDate());
        expenseDto.setCategory(expenses.getCategory());
        expenseDto.setUserId(expenses.getUser().getId());
        return expenseDto;
    }
}
