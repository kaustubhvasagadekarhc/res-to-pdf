import { Request, Response } from 'express';
import { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema } from "../schemas/auth.schema";
import { registerUser } from '../services/auth/register.service';
import { loginUser } from '../services/auth/login.service';
import { verifyUserOtp } from '../services/auth/verifyOtp.service';
import { resendUserOtp } from '../services/auth/resendOtp.service';
import { generateToken } from '../services/auth/token.service';

export const getToken = (req: Request, res: Response) => {
  try {
    const result = generateToken();
    return res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    res.status(500).json({ status: "error", message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const userData = registerSchema.parse(req.body);
    const result = await registerUser(userData);
    
    res.status(201).json({
      status: "success",
      message: "User registered successfully. Please verify your email.",
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    res.status(400).json({ status: "error", message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const result = await verifyUserOtp(email, otp);

    res.cookie("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: "success",
      message: "Email verified successfully",
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    res.status(400).json({ status: "error", message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginUser(email, password);

    res.cookie("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    res.status(400).json({ status: "error", message });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = resendOtpSchema.parse(req.body);
    await resendUserOtp(email);

    res.status(200).json({ 
      status: "success", 
      message: "OTP resent successfully" 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    res.status(400).json({ status: "error", message });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie("auth-token");
  res.status(200).json({ 
    status: "success", 
    message: "Logged out successfully" 
  });
};
