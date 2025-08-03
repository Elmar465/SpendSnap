package com.example.spendsnap.service;


import com.example.spendsnap.model.UserModel;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    public String secretKey = null;


    public String generateToken(UserModel user){
        Map<String,Object> claims = new HashMap<>();
        return Jwts
                .builder()
                .claims()
                .add(claims)
                .subject(user.getUsername())
                .issuer("DCB")
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 60 *10*10000))
                .and()
                .signWith(generateKey())
                .compact();
    }

    public SecretKey generateKey(){
            byte[] decode = Decoders.BASE64.decode(getSecretKey());
            return Keys.hmacShaKeyFor(decode);
    }

    public String getSecretKey(){
        return secretKey = "mni1T1FvYLls72sdkfBPlvkBRJTERKqOh15X7zuMoQ0=";
    }

    public String extractUsername(String token){
            return extractClaim(token, Claims::getSubject);
    }

    private <T> T extractClaim(String token, Function<Claims, T>  claimResolver){
            Claims claims = extractClaim(token);
            return claimResolver.apply(claims);
    }

    private Claims extractClaim(String token){
        return Jwts
                .parser()
                .verifyWith(generateKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token, UserDetails userDetails){
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public boolean isTokenExpired(String token){
        return extractExpiration(token).before(new Date());
    }

    public Date extractExpiration(String token){
        return  extractClaim(token, Claims::getExpiration);
    }
}
