import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
}

const BankAccountsList = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true);
      
      if (!error && data) {
        setAccounts(data);
      }
      setLoading(false);
    };

    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-lg">Bank Accounts</CardTitle>
        <CardDescription>Transfer to any of these accounts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="p-4 rounded-lg border">
            <p className="font-medium text-foreground">{account.bank_name}</p>
            <p className="text-sm text-muted-foreground">{account.branch}</p>
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Account: </span>
                <span className="font-mono">{account.account_number}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Name: </span>
                {account.account_name}
              </p>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No bank accounts configured
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BankAccountsList;
