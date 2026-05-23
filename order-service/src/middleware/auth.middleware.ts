import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // 1. Ambil token dari header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token tidak ditemukan" });
    return;
  }

  // 2. Ekstrak token-nya saja (buang kata "Bearer ")
  const token = authHeader.split(" ")[1];

  // 3. Verifikasi token ke Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Token tidak valid" });
    return;
  }

  // 4. Cek apakah user ini punya role admin
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (userError || !userData) {
    res.status(403).json({ error: "User tidak ditemukan" });
    return;
  }

  if (userData.role !== "admin") {
    res.status(403).json({ error: "Akses ditolak. Bukan admin." });
    return;
  }

  // 5. Lolos semua pengecekan → lanjut ke controller
  next();
}
