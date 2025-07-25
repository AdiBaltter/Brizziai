import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User } from '@/api/entities';
import { 
  ArrowLeft, 
  CheckCircle, 
  MessageSquare, 
  FileText, 
  Mail, 
  Phone,
  Brain,
  Folder,
  FileCheck,
  Eye
} from 'lucide-react';

export default function Landing() {
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    setLoading(true);
    try {
      await User.loginWithRedirect(window.location.href);
    } catch (error) {
      console.error("Login failed", error);
      try {
        await User.login();
      } catch (fallbackError) {
        console.error("Fallback login also failed", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const problemItems = [
    { icon: <FileText className="h-8 w-8 text-red-500" />, text: "טבלת אקסל אחת לניהול לקוחות" },
    { icon: <MessageSquare className="h-8 w-8 text-red-500" />, text: "וואטסאפ עם אינסוף שיחות פתוחות" },
    { icon: <FileCheck className="h-8 w-8 text-red-500" />, text: "פתקים עם משימות" },
    { icon: <Mail className="h-8 w-8 text-red-500" />, text: "מיילים שלא חזרת אליהם" }
  ];

  const howItWorks = [
    { icon: <Phone className="h-12 w-12 text-blue-500" />, title: "אתה מדבר עם הלקוח", subtitle: "שיחה רגילה כמו תמיד" },
    { icon: <Brain className="h-12 w-12 text-purple-500" />, title: "Brizzi שומעת, מסכמת ויוצרת משימות", subtitle: "בינה מלאכותית שעובדת בשבילך" },
    { icon: <Folder className="h-12 w-12 text-green-500" />, title: "היא פותחת חדר דיגיטלי ללקוח", subtitle: "עם הכל בפנים, מסודר ונגיש" },
    { icon: <FileCheck className="h-12 w-12 text-orange-500" />, title: "מסמכים, סיכומים, תזכורות", subtitle: "נשלחים לבד באופן אוטומטי" },
    { icon: <Eye className="h-12 w-12 text-indigo-500" />, title: "אתה רואה בדיוק איפה כל לקוח עומד", subtitle: "בלי לשאול, בלי לחפש" }
  ];

  const benefits = [
    "תהליך ברור שחוזר על עצמו",
    "אפס ניהול ידני",
    "פחות וואטסאפים, פחות פינג פונג",
    "לקוחות שמבינים מה קורה – בלי לשאול אותך",
    "שקט בראש, זמן בידיים, וסיסטם בידיים שלך"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/041688fe9_20250714_1322_BrizziAILogo_simple_compose_01k0477xbzepbsshhyv582hxa9.png" 
            alt="Brizzi AI Logo" 
            className="h-12" 
          />
          <Button variant="outline" onClick={handleGetStarted}>
            כניסה למערכת
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-6xl mb-6">💥</div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
            אתה טוב במה שאתה עושה.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              תן ל-Brizzi לדאוג לכל השאר.
            </span>
          </h1>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-4xl mb-4">⛔</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-8">
              היום העסק שלך נראה ככה?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {problemItems.map((item, index) => (
              <Card key={index} className="bg-red-50 border-red-200 hover:bg-red-100 transition-colors">
                <CardContent className="flex items-center gap-4 p-6">
                  {item.icon}
                  <span className="text-lg font-medium text-gray-800">{item.text}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-red-100 to-orange-100 border-red-300">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-red-800 mb-4">והכי גרוע?</h3>
              <p className="text-xl text-red-700">
                אין תהליך ברור. הכל קורה תוך כדי ריצה.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-5xl mb-6">👋</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              מעכשיו – Brizzi מסדרת לך הכל.
            </h2>
            <div className="text-2xl font-semibold mb-6 text-blue-100">
              תהליך מותאם אישית. חד-פעמי. שרץ לבד.
            </div>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">אתה בונה תהליך פעם אחת –</h3>
                <div className="text-xl space-y-4 text-blue-100">
                  <p>והמערכת יודעת לבד:</p>
                  <ul className="space-y-3">
                    <li>✨ מה לעשות אחרי כל שיחה,</li>
                    <li>✨ איזה מסמך לשלוח,</li>
                    <li>✨ מתי להזכיר ללקוח,</li>
                    <li>✨ ומה הסטטוס של כל משימה.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Message */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">💡</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                במקום לפזר הכל בין אקסלים, וואטסאפים ומיילים –
              </h2>
              <p className="text-2xl text-gray-800 font-semibold">
                הכל קורה במקום אחד. אוטומטית. בעברית.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
              איך זה עובד?
            </h2>
            
            <div className="space-y-8">
              {howItWorks.map((step, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="flex items-center gap-8 p-8">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        {step.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-lg text-gray-600">{step.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
            ומה יוצא לך מזה?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-green-50 border-green-200 hover:bg-green-100 transition-colors">
                <CardContent className="flex items-center gap-4 p-6">
                  <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                  <span className="text-lg font-medium text-gray-800">{benefit}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final Message */}
      <section className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              זו לא עוד מערכת.
            </h2>
            <p className="text-2xl mb-12 text-blue-100">
              זו תשתית שקטה לעסק שלך.
            </p>
            
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white mb-12">
              <CardContent className="p-8">
                <p className="text-xl mb-6">
                  אם אתה טוב במה שאתה עושה –
                </p>
                <p className="text-2xl font-semibold text-blue-100">
                  תן ל-Brizzi לבנות לך תהליך שרץ לבד,
                  <br />
                  ושם קץ לבלאגן.
                </p>
              </CardContent>
            </Card>

            <div className="text-2xl mb-8">📌</div>
            <Button 
              size="lg" 
              className="text-xl px-12 py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-2xl transform hover:scale-105 transition-all"
              onClick={handleGetStarted}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  טוען...
                </div>
              ) : (
                <>
                  אני רוצה לראות איך זה עובד
                  <ArrowLeft className="mr-3 h-6 w-6" />
                </>
              )}
            </Button>
            
            <p className="text-sm text-blue-200 mt-6">
              ניסיון של 14 יום בחינם • בלי כרטיס אשראי • התחלה מיידית
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <div className="container mx-auto px-6">
          <p>&copy; {new Date().getFullYear()} Brizzi AI. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}