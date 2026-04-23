import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  size?: "default" | "large";
}

export const MagneticButton = ({ children, href = "#", className = "", size = "default" }: MagneticButtonProps) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100) {
      const f = (1 - dist / 100) * 8;
      setOffset({ x: (dx / dist) * f, y: (dy / dist) * f });
    } else {
      setOffset({ x: 0, y: 0 });
    }
  };

  const sizeClasses = size === "large" ? "px-10 h-14 text-lg" : "px-8 h-12 text-base";
  const isInternal = href.startsWith("/") && !href.startsWith("//");
  const MotionLink = motion(Link);
  const sharedProps = {
    ref,
    className: `cs-focus cs-btn-primary shine-effect inline-flex items-center justify-center font-semibold ${sizeClasses} ${className}`,
    animate: { x: offset.x, y: offset.y },
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
    onMouseMove: handleMouseMove,
    onMouseLeave: () => setOffset({ x: 0, y: 0 }),
  };

  if (isInternal) {
    return <MotionLink to={href} {...sharedProps}>{children}</MotionLink>;
  }
  return <motion.a href={href} {...sharedProps}>{children}</motion.a>;
};
