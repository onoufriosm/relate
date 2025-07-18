import type { Route } from "./+types/home";
import { Home } from "../home/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home" },
    { name: "description", content: "Welcome to AI Assistant!" },
  ];
}

export default function HomePage() {
  return <Home />;
}
