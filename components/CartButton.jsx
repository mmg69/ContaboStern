import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "stern_cart_v1";

// 🔹 safe parse para evitar reventar la app
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function CartButton() {
  const [count, setCount] = useState(0);

  // 🔹 Función para recalcular el número del carrito
  function updateCount() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = safeParse(raw) || [];

      const total = Array.isArray(data)
        ? data.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0)
        : 0;

      setCount(total);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    updateCount(); // al cargar

    // Escuchar cuando se actualice el carrito
    window.addEventListener("cart-updated", updateCount);

    return () => window.removeEventListener("cart-updated", updateCount);
  }, []);

  return (
    <Link href="/carrito" style={{ position: "relative", textDecoration: "none" }}>
      <button
        aria-label="Carrito"
        style={{
          position: "relative",
          width: 44,
          height: 44,
          borderRadius: "999px",
          background: "linear-gradient(135deg,#2563eb,#1e3a8a)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
        }}
      >
        🛒

        {/* 🔴 Globo rojo con número */}
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              borderRadius: "999px",
              background: "#ef4444",
              color: "white",
              fontSize: "11px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 6px rgba(239, 68, 68, 0.6)",
            }}
          >
            {count}
          </span>
        )}
      </button>
    </Link>
  );
}
