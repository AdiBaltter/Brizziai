
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Check, CreditCard, Download, ArrowUp, Zap, Loader2, Star, Package, Calendar, Receipt, CheckCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/api/entities';
// import { useNavigate } from "react-router-dom"; // Removed as it's not used in the new outline
// import { createPageUrl } from "@/utils"; // Removed as it's not used in the new outline

const plans = [
  {
    id: 'basic',
    name: 'בסיסי',
    price: '₪198',
    period: '/חודש',
    description: 'מושלם עבור עסקים קטנים',
    features: [
      'מערכת לניהול לקוחות',
      '2 תהליכים מותאמים אישית',
      'חדר דיגיטלי שיתופי ללקוח',
      'הקלטת שיחות, תמלול וסיכום - 12 שיחות',
      'ניהול משימות חכם'
    ],
    limits: {
      processes: 2,
      recordings: 12,
      clients: 100
    }
  },
  {
    id: 'standard',
    name: 'סטנדרטי',
    price: '₪348',
    period: '/חודש',
    description: 'הבחירה הפופולרית לעסקים גדלים',
    popular: true,
    features: [
      'מערכת לניהול לקוחות',
      '5 תהליכים מותאמים אישית',
      'חדר דיגיטלי שיתופי ללקוח',
      'הקלטת שיחות, תמלול וסיכום - 30 שיחות',
      'ניהול משימות חכם',
      'אינטגרציות לוואטסאפ'
    ],
    limits: {
      processes: 5,
      recordings: 30,
      clients: 300
    }
  },
  {
    id: 'premium',
    name: 'פרימיום',
    price: '₪598',
    period: '/חודש',
    description: 'פתרון מלא לעסקים מתקדמים',
    features: [
      'מערכת לניהול לקוחות',
      '10 תהליכים מותאמים אישית',
      'חדר דיגיטלי שיתופי ללקוח',
      'הקלטת שיחות, תמלול וסיכום - 100 שיחות',
      'הכנסת משימות אישיות - ניהול משימות מתקדם',
      'אינטגרציות לוואטסאפ',
      'סוכן AI לקביעת פגישות וחימום לידים בוואטסאפ',
      'חתימה דיגיטלית וניהול מסמכים - עד 50 מסמכים',
      'הצעות מחיר ואפיון אוטומטיים - עד 50 הצעות מחיר',
      'ניהול צוותים והרשאות',
      'דוחות וביצועים'
    ],
    limits: {
      processes: 10,
      recordings: 100,
      clients: 1000,
      documents: 50,
      quotes: 50
    }
  }
];

// Mock billing history
const mockBillingHistory = [
  { id: 1, date: '2024-01-01', amount: '₪348', status: 'שולם', plan: 'סטנדרטי', invoice_url: '#' },
  { id: 2, date: '2023-12-01', amount: '₪348', status: 'שולם', plan: 'סטנדרטי', invoice_url: '#' },
  { id: 3, date: '2023-11-01', amount: '₪348', status: 'שולם', plan: 'סטנדרטי', invoice_url: '#' }
];

export default function SubscriptionTab() {
  const [currentPlan, setCurrentPlan] = useState('standard');
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Added
  
  // Usage data
  const [usage, setUsage] = useState({
    processes: { used: 3, total: 5 },
    recordings: { used: 18, total: 30 },
    clients: { used: 45, total: 300 },
    credits: { used: 120, total: 500 } // Added credits
  });
  
  const { toast } = useToast();
  // const navigate = useNavigate(); // Removed

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        setCurrentPlan(user.plan_type || 'basic');
        setBillingPeriod(user.billing_period || 'monthly');
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת נתוני משתמש",
          description: "לא ניתן היה לטעון את נתוני המנוי שלך. אנא רענן את העמוד.",
        });
      }
    };
    loadUserData();
  }, []);

  const currentPlanData = plans.find(p => p.id === currentPlan);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await User.updateMyUserData({
        subscription_status: 'active',
        plan_type: selectedPlan,
        billing_period: billingPeriod
      });

      toast({
        title: "שודרגת בהצלחה!",
        description: `המנוי שלך לתוכנית ${plans.find(p => p.id === selectedPlan)?.name} פעיל.`,
        className: "bg-green-100 text-green-800"
      });

      setCurrentPlan(selectedPlan);
      window.location.reload();

    } catch (error) {
      console.error("Upgrade failed", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "השדרוג נכשל. אנא נסה שוב.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (confirm('האם אתה בטוח שברצונך לבטל את המנוי? החשבון יחזור לתוכנית הבסיסית.')) {
      try {
        await User.updateMyUserData({
          subscription_status: 'cancelled',
          plan_type: 'basic'
        });
        
        toast({
          title: "המנוי בוטל",
          description: "המנוי שלך יישאר פעיל עד סוף התקופה הנוכחית.",
        });
        
        setCurrentPlan('basic');
        window.location.reload();
      } catch (error) {
        console.error("Cancellation failed", error);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "ביטול המנוי נכשל. אנא פנה לתמיכה.",
        });
      }
    }
  };

  const getDiscountedPrice = (price) => {
    if (billingPeriod === 'yearly') {
      const numPrice = parseInt(price.replace('₪', ''));
      const discounted = Math.round(numPrice * 0.85);
      return `₪${discounted}`;
    }
    return price;
  };

  const downloadInvoice = (invoiceId) => {
    // Mock download functionality
    const link = document.createElement('a');
    link.href = '#'; // In real implementation, this would be the actual invoice URL
    link.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "הורדת חשבונית",
      description: "החשבונית נמצאת בהורדה...",
    });
  };
  
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Current Plan Status Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-xl">המנוי הנוכחי שלך</CardTitle>
                <p className="text-blue-600 font-semibold">תוכנית {currentPlanData?.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancelSubscription}>
                ביטול מנוי
              </Button>
              <Button onClick={() => setSelectedPlan(currentPlan)}>
                שדרוג חבילה
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            {/* Credits Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>קרדיטים</span>
                <span>{usage.credits.total - usage.credits.used}/{usage.credits.total}</span>
              </div>
              <Progress value={((usage.credits.total - usage.credits.used) / usage.credits.total) * 100} />
              <p className="text-xs text-gray-600">נותרו {usage.credits.total - usage.credits.used} קרדיטים</p>
            </div>
            
            {/* Process Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>תהליכים פעילים</span>
                <span>{usage.processes.used}/{usage.processes.total}</span>
              </div>
              <Progress value={(usage.processes.used / usage.processes.total) * 100} />
              <p className="text-xs text-gray-600">ניצול {Math.round((usage.processes.used / usage.processes.total) * 100)}%</p>
            </div>
            
            {/* Recording Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>הקלטות חודשיות</span>
                <span>{usage.recordings.used}/{usage.recordings.total}</span>
              </div>
              <Progress value={(usage.recordings.used / usage.recordings.total) * 100} />
              <p className="text-xs text-gray-600">נותרו {usage.recordings.total - usage.recordings.used} הקלטות</p>
            </div>
            
            {/* Client Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>לקוחות במערכת</span>
                <span>{usage.clients.used}/{usage.clients.total}</span>
              </div>
              <Progress value={(usage.clients.used / usage.clients.total) * 100} />
              <p className="text-xs text-gray-600">ניצול {Math.round((usage.clients.used / usage.clients.total) * 100)}%</p>
            </div>
          </div>
          
          {/* Plan Features */}
          <div className="bg-white/80 rounded-lg p-4">
            <h4 className="font-semibold mb-2">התכונות שלך:</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {currentPlanData?.features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            חיובים אחרונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockBillingHistory.map(bill => (
              <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{bill.plan}</p>
                    <p className="text-sm text-gray-500">{bill.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg">{bill.amount}</span>
                  <Badge className="bg-green-100 text-green-700">{bill.status}</Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadInvoice(bill.id)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    הורד חשבונית
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plans Section */}
      <div className="text-right">
        <h2 className="text-2xl font-bold">שדרוג חבילה</h2>
        <p className="text-lg text-gray-600 mt-2">בחר את התוכנית המתאימה לך</p>
        
        {/* Billing Period Toggle */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <span className={billingPeriod === 'monthly' ? 'font-semibold' : 'text-gray-500'}>חודשי</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={billingPeriod === 'yearly' ? 'font-semibold' : 'text-gray-500'}>
            שנתי 
            <Badge className="mr-2 bg-green-100 text-green-800">חסוך 15%</Badge>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map(plan => (
          <Card 
            key={plan.id}
            className={`cursor-pointer transition-all relative ${
              selectedPlan === plan.id 
                ? 'border-blue-500 border-2 shadow-xl scale-105' 
                : 'hover:shadow-lg'
            } ${plan.popular ? 'border-yellow-400' : ''} ${
              plan.id === currentPlan ? 'bg-green-50 border-green-400' : ''
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-400 text-yellow-900 px-3 py-1">
                  <Star className="w-3 h-3 ml-1" />
                  הכי פופולרי
                </Badge>
              </div>
            )}
            
            {plan.id === currentPlan && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-500 text-white px-3 py-1">התוכנית הנוכחית</Badge>
              </div>
            )}
            
            <CardHeader className="text-right">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline justify-end gap-2 mt-4">
                <span className="text-4xl font-extrabold">{getDiscountedPrice(plan.price)}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              {billingPeriod === 'yearly' && (
                <div className="text-sm text-gray-500 line-through">{plan.price}/חודש</div>
              )}
              <p className="text-gray-600 mt-2">{plan.description}</p>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 flex-row-reverse text-right">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedPlan !== currentPlan && (
        <Card>
          <CardHeader className="text-right">
            <CardTitle>פרטי תשלום</CardTitle>
            <p className="text-sm text-gray-500">התשלום מאובטח באמצעות Stripe.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">מספר כרטיס אשראי</Label>
              <Input id="card-number" placeholder="**** **** **** 1234" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-date">תוקף</Label>
                <Input id="expiry-date" placeholder="MM / YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="123" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-name">שם מלא על הכרטיס</Label>
              <Input id="card-name" placeholder="ישראל ישראלי" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-4">
              <div className="text-right p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-lg">
                  סיכום הזמנה - תוכנית {plans.find(p => p.id === selectedPlan)?.name}
                </h3>
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {getDiscountedPrice(plans.find(p => p.id === selectedPlan)?.price)}/חודש
                </div>
                {billingPeriod === 'yearly' && (
                  <div className="text-sm text-gray-600 mt-1">
                    חיוב שנתי - חסוך 15%
                  </div>
                )}
              </div>
              <Button size="lg" className="w-full text-lg" onClick={handleUpgrade} disabled={loading}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 
                  <>
                    <Zap className="h-5 w-5 ml-2" />
                    שדרג עכשיו
                  </>
                }
              </Button>
              <p className="text-xs text-gray-500 text-right">
                ניתן לבטל בכל עת. ללא עמלות ביטול.
              </p>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
