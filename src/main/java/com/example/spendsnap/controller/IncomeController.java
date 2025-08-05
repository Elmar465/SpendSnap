package com.example.spendsnap.controller;


import com.example.spendsnap.dto.IncomeDto;
import com.example.spendsnap.model.IncomeModel;
import com.example.spendsnap.service.IncomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.example.spendsnap.service.IncomeService.toDo;

@RestController
@RequestMapping("income")
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeService incomeService;


    @PostMapping("/addIncome")
    public ResponseEntity<IncomeDto> addIncome(@RequestBody IncomeDto incomeDto) {
        IncomeDto addIncome = incomeService.addIncomeFromDto(incomeDto);
        return new ResponseEntity<>(addIncome, HttpStatus.CREATED);
    }

    @PutMapping("/updateIncomeDetails")
    public ResponseEntity<IncomeDto> updateIncomeDetails(@RequestBody IncomeModel update) {
        IncomeModel updateIncome = incomeService.updateIncomeFromDto(update);
        IncomeDto incomeDto = toDo(updateIncome);
        return new ResponseEntity<>(incomeDto, HttpStatus.OK);
    }

    @GetMapping("/getIncomeByUserId/{userId}")
    public ResponseEntity<List<IncomeModel>> getIncomeByUserId(@PathVariable Integer userId) {
        List<IncomeModel> incomeModels = incomeService.getIncomeByUserId(userId);
        List<IncomeDto> incomeDtos = incomeModels.stream()
                .map(IncomeService::toDo)
                .toList();
        return  new ResponseEntity<>(incomeModels, HttpStatus.OK);
    }


    @GetMapping("/getTotalIncomeByUser/{userId}")
    public ResponseEntity<Double> getTotalIncomeByUser(@PathVariable Integer userId) {
        Double model = incomeService.getTotalIncomeByUser(userId);
        return new ResponseEntity<>(model, HttpStatus.OK);
    }

    @GetMapping("/getMonthlyIncomeSumByUser/{userId}/{month}/{year}")
    public ResponseEntity<Double> getMonthlyIncomeSumByUser(@PathVariable Integer userId, @PathVariable Integer month, @PathVariable Integer year) {
        Double model = incomeService.getMonthlyIncomeSumByUser(userId, month, year);
        return  new  ResponseEntity<>(model, HttpStatus.OK);
    }

    @GetMapping("/getMonthlyIncomeByUser/{userId}/{month}/{year}")
    public ResponseEntity<List<IncomeDto>> getMonthlyIncomeByUser (@PathVariable Integer userId,
                                                                   @PathVariable Integer month,
                                                                   @PathVariable Integer year) {
        List<IncomeModel> infos =  incomeService.getMonthlyIncomeByUser(userId, month, year);
        List<IncomeDto> dtos = infos.stream().map(IncomeService::toDo).toList();
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncome(@PathVariable Integer id) {
        incomeService.deleteIncomeFromDto(id);
        return ResponseEntity.noContent().build();
    }
}
