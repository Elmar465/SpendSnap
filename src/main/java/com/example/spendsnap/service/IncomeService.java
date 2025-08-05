package com.example.spendsnap.service;


import com.example.spendsnap.dao.IncomeDao;
import com.example.spendsnap.dao.UserDao;
import com.example.spendsnap.dto.IncomeDto;
import com.example.spendsnap.model.IncomeModel;
import com.example.spendsnap.model.UserModel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IncomeService {

    private final IncomeDao incomeDao;
    private final UserDao userDao;
    private final UserService userService;


    public IncomeDto addIncomeFromDto(IncomeDto incomeDto) {
        UserModel  usermodel = userService.findUserById(incomeDto.getUserId());
        IncomeModel incomeModel = new IncomeModel(
                null,
                incomeDto.getAmount(),
                incomeDto.getDescription(),
                incomeDto.getDate(),
                incomeDto.getCategory(),
                usermodel
        );
        IncomeModel saved = incomeDao.save(incomeModel);
        return toDo(saved);
    }

    public List<IncomeModel> getIncomeByUserId(Integer userId) {
        UserModel userModel = userDao.findById(userId).orElse(null);
        if (userModel == null) {
            return Collections.emptyList();
        }
        return  incomeDao.findByUser(userModel);
    }

   public  Double getTotalIncomeByUser(Integer userId) {
        UserModel userModel = userDao.findById(userId).orElse(null);
        if (userModel == null) {
            return incomeDao.getTotalIncomeByUser(userId) != null ? incomeDao.getTotalIncomeByUser(userId) : 0.0;
        }
        return incomeDao.getTotalIncomeByUser(userId);
    }

  public  Double getMonthlyIncomeSumByUser(Integer userId, Integer month, Integer year) {
        UserModel userModel = userDao.findById(userId).orElse(null);
        if (userModel == null) {
            return 0.0;
        }
        Double sum = incomeDao.getMonthlyIncomeSumByUser(userId, month, year);
        return sum != null ? sum : 0.0;
    }

   public List<IncomeModel> getMonthlyIncomeByUser(Integer userId, Integer month, Integer year) {
        UserModel userModel = userDao.findById(userId).orElse(null);
        if (userModel == null) {
            return Collections.emptyList();
        }
        return incomeDao.getMonthlyIncomeByUser(userId, month,year);
    }

    public IncomeModel updateIncomeFromDto(IncomeModel incomeDto) {
        IncomeModel incomeModel =  incomeDao.findById(incomeDto.getId()).orElse(new IncomeModel());
        //assert incomeModel != null;
        incomeModel.setAmount(incomeDto.getAmount());
        incomeModel.setDescription(incomeDto.getDescription());
        return incomeDao.save(incomeModel);
    }

    public void deleteIncomeFromDto(Integer incomeId) {
        incomeDao.deleteById(incomeId);
    }

    public static IncomeDto toDo(IncomeModel incomeModel) {
        IncomeDto incomeDtoToAdd = new IncomeDto();
        incomeDtoToAdd.setAmount(incomeModel.getAmount());
        incomeDtoToAdd.setDescription(incomeModel.getDescription());
        incomeDtoToAdd.setDate(incomeModel.getDate());
        incomeDtoToAdd.setDescription(incomeModel.getDescription());
        if (incomeModel.getUser() != null) incomeDtoToAdd.setUserId(incomeModel.getUser().getId());
        return incomeDtoToAdd;
    }
}
