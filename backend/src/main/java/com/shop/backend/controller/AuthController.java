package com.shop.backend.controller;

import com.shop.backend.config.JwtTokenProvider;
import com.shop.backend.dto.ActiveSessionsResponse;
import com.shop.backend.dto.AuthResponse;
import com.shop.backend.dto.MessageResponse;
import com.shop.backend.dto.UserResponse;
import com.shop.backend.model.User;
import com.shop.backend.repository.UserRepository;
import com.shop.backend.service.SessionManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SessionManager sessionManager;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        // Check if user already exists
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        // Create new user (hash password)
        user.setIsAdmin(false);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        
        // Generate token
        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getUsername());
        
        // Create session in Redis
        sessionManager.createSession(savedUser.getId(), token);
        sessionManager.logActivity(savedUser.getId(), "SIGNUP", "User account created");
        
        return ResponseEntity.ok(new AuthResponse(savedUser, token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> user = userRepository.findByUsername(request.getUsername());

        if (user.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }
        String stored = user.get().getPassword();
        boolean isBcrypt = stored != null && stored.startsWith("$2");
        if (!isBcrypt) {
            // Legacy plaintext password: verify then upgrade to bcrypt
            if (!stored.equals(request.getPassword())) {
                return ResponseEntity.badRequest().body("Invalid password");
            }
            user.get().setPassword(passwordEncoder.encode(stored));
            userRepository.save(user.get());
        } else {
            if (!passwordEncoder.matches(request.getPassword(), stored)) {
                return ResponseEntity.badRequest().body("Invalid password");
            }
        }

        // Generate token
        String token = jwtTokenProvider.generateToken(user.get().getId(), user.get().getUsername());
        
        // Create session in Redis
        sessionManager.createSession(user.get().getId(), token);
        sessionManager.logActivity(user.get().getId(), "LOGIN", "User logged in");
        
        return ResponseEntity.ok(new AuthResponse(user.get(), token));
    }

    @PostMapping("/login-localhost")
    public ResponseEntity<?> loginLocalhost() {
        // For localhost testing - return admin user with token
        Optional<User> admin = userRepository.findByUsername("admin");
        if (admin.isEmpty()) {
            return ResponseEntity.badRequest().body("Admin user not found");
        }

        String token = jwtTokenProvider.generateTokenForLocalhost(admin.get().getId(), admin.get().getUsername());
        
        // Create session in Redis
        sessionManager.createSession(admin.get().getId(), token);
        sessionManager.logActivity(admin.get().getId(), "LOGIN_LOCALHOST", "Localhost testing mode");
        
        return ResponseEntity.ok(new AuthResponse(
            admin.get(),
            token,
            "Localhost testing mode - auto-logged as admin (dev only)"
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestAttribute Long userId) {
        sessionManager.logActivity(userId, "LOGOUT", "User logged out");
        sessionManager.invalidateSession(userId);
        
        return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
    }

    @GetMapping("/sessions/count")
    public ResponseEntity<?> getActiveSessions() {
        Long count = sessionManager.getActiveSessions();
        return ResponseEntity.ok(new ActiveSessionsResponse(count));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestAttribute Long userId) {
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(new UserResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/user/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    if (userDetails.getFirstName() != null)
                        user.setFirstName(userDetails.getFirstName());
                    if (userDetails.getLastName() != null)
                        user.setLastName(userDetails.getLastName());
                    if (userDetails.getPhone() != null)
                        user.setPhone(userDetails.getPhone());
                    if (userDetails.getEmail() != null)
                        user.setEmail(userDetails.getEmail());
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}

class LoginRequest {
    private String username;
    private String password;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}