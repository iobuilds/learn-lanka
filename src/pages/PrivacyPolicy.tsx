import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">Last updated: February 2026</p>
            </div>
          </div>
        </div>

        <Card className="card-elevated">
          <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground">We collect the following types of information:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Personal Information:</strong> Name, phone number, birthday, school name, grade, and address</li>
                <li><strong>Account Information:</strong> Login credentials and profile details</li>
                <li><strong>Payment Information:</strong> Bank transfer details and payment slips</li>
                <li><strong>Usage Data:</strong> Information about how you use our platform, including class enrollments and assessment results</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide and maintain our educational services</li>
                <li>Process payments and verify transactions</li>
                <li>Send SMS notifications about classes, payments, and updates</li>
                <li>Improve our platform and user experience</li>
                <li>Respond to your inquiries and support requests</li>
                <li>Track your academic progress and provide personalized recommendations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. Information Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>With service providers who assist in operating our platform (e.g., SMS providers)</li>
                <li>To protect our rights, privacy, safety, or property</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as your account is active or as needed to provide you with our services. We may also retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Access your personal information</li>
                <li>Update or correct your information through your profile</li>
                <li>Request deletion of your account (subject to legal requirements)</li>
                <li>Opt-out of promotional SMS messages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. SMS Communications</h2>
              <p className="text-muted-foreground">
                By providing your phone number, you consent to receive SMS messages from us regarding:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>One-time passwords (OTP) for account verification</li>
                <li>Class schedules and updates</li>
                <li>Payment confirmations and reminders</li>
                <li>Important announcements and notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use local storage and session storage to maintain your login session and preferences. This helps us provide a seamless experience across your visits.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are designed for students, including minors. We collect information from students with the understanding that parents or guardians are aware of their use of our platform. Parents or guardians may contact us to review, update, or delete their child's information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us through our <a href="/contact" className="text-primary hover:underline">Contact Page</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
