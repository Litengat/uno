import { SignIn } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SignInPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-red-500 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-yellow-500 rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-green-500 rounded-full opacity-12 animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 right-1/3 w-12 h-12 bg-blue-500 rounded-full opacity-10 animate-bounce delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Game logo/title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-2 drop-shadow-lg">
            UNO
          </h1>
          <p className="text-white/80 text-lg font-medium">
            Welcome back! Ready to play?
          </p>
        </div>

        {/* Sign-in card */}
        <Card className="backdrop-blur-sm bg-gray-800/90 border border-gray-700 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-white">
              Sign In
            </CardTitle>
            <p className="text-gray-300 text-sm mt-2">
              Join the fun and challenge your friends!
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-center">
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 bg-transparent",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "bg-gray-700 border-2 border-gray-600 hover:border-gray-500 text-white hover:bg-gray-600 transition-all duration-200",
                    formButtonPrimary:
                      "bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white border-0 transition-all duration-200 transform hover:scale-105",
                    footerActionLink: "text-blue-400 hover:text-blue-300",
                    identityPreviewEditButton:
                      "text-blue-400 hover:text-blue-300",
                    formFieldInput:
                      "bg-gray-700 border-2 border-gray-600 focus:border-red-400 focus:ring-red-200 text-white placeholder:text-gray-400",
                    dividerLine: "bg-gray-600",
                    dividerText: "text-gray-400",
                    formFieldLabel: "text-gray-300",
                    footerAction: "text-gray-300",
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fun gaming elements */}

        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-8 h-12 bg-red-600 rounded-lg shadow-lg transform rotate-12"></div>
            <div className="w-8 h-12 bg-yellow-500 rounded-lg shadow-lg transform -rotate-6"></div>
            <div className="w-8 h-12 bg-green-500 rounded-lg shadow-lg transform rotate-3"></div>
            <div className="w-8 h-12 bg-blue-600 rounded-lg shadow-lg transform -rotate-12"></div>
          </div>
          <p className="text-white/70 text-sm">
            🎮 The classic card game, now online!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
