import express from "express";
import cors from "cors";
import { supabase } from "./lib/supabase";
import authRoutes from "./routes/auth.route";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  const { error } = await supabase.from("products").select("id").limit(1);

  if (error) {
    res.status(500).json({
      status: "error",
      service: "product-service",
      message: error.message,
    });
    return;
  }

  res.json({
    status: "ok",
    service: "user-service",
    database: "connected ✅",
  });
});

app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`✅ user-service berjalan di port ${PORT}`);
});
