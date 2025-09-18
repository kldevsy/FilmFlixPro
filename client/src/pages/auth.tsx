// Blueprint integration: javascript_log_in_with_replit - Login page
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, User } from "lucide-react";

export default function Auth() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800/80 border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Bem-vindo ao StreamFlix</CardTitle>
            <CardDescription className="text-gray-300">
              Entre com sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              asChild 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-login"
            >
              <a href="/api/login">
                <LogIn className="w-4 h-4 mr-2" />
                Entrar com Replit
              </a>
            </Button>
            <p className="text-sm text-gray-400 text-center">
              Suporta login com Google, GitHub, X, Apple e email/senha
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}