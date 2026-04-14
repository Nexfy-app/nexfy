import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, Star, MapPin, ArrowLeft,
  TrendingUp, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { motion } from 'framer-motion';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card className="border rounded-2xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u.role !== 'admin') navigate('/');
    });
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin',
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['admin-pros'],
    queryFn: () => base44.entities.Professional.list(),
    enabled: user?.role === 'admin',
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () => base44.entities.ServiceRequest.list('-created_date', 50),
    enabled: user?.role === 'admin',
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 50),
    enabled: user?.role === 'admin',
  });

  const onlinePros = professionals.filter(p => p.is_available).length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;

  const handleSuspend = async (proId) => {
    await base44.entities.Professional.update(proId, { status: 'suspended', is_available: false });
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate('/profile')}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold">Painel Administrativo</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Usuários" value={users.length} icon={Users} color="bg-primary/10 text-primary" />
          <StatCard title="Profissionais" value={professionals.length} icon={Briefcase} color="bg-accent/10 text-accent" />
          <StatCard title="Online Agora" value={onlinePros} icon={MapPin} color="bg-green-500/10 text-green-600" />
          <StatCard title="Pendentes" value={pendingRequests} icon={Clock} color="bg-yellow-500/10 text-yellow-600" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Concluídos" value={completedRequests} icon={CheckCircle2} color="bg-green-500/10 text-green-600" />
          <StatCard title="Avaliações" value={reviews.length} icon={Star} color="bg-yellow-500/10 text-yellow-600" />
        </div>

        <Tabs defaultValue="users">
          <TabsList className="w-full rounded-xl bg-secondary h-10">
            <TabsTrigger value="users" className="flex-1 rounded-lg text-xs">Usuários</TabsTrigger>
            <TabsTrigger value="pros" className="flex-1 rounded-lg text-xs">Profissionais</TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 rounded-lg text-xs">Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="bg-card rounded-2xl border overflow-hidden mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Nome</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell className="text-xs">{u.full_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{u.role}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.ip_address || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="pros">
            <div className="space-y-2 mt-3">
              {professionals.map(p => (
                <div key={p.id} className="bg-card rounded-2xl border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary overflow-hidden">
                    {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">{p.name?.charAt(0)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.user_email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={`text-[10px] ${p.is_available ? 'bg-green-500/10 text-green-700' : ''}`}>
                        {p.is_available ? '● Online' : '○ Offline'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">{p.status}</Badge>
                    </div>
                  </div>
                  {p.status !== 'suspended' && (
                    <Button size="sm" variant="outline" className="text-xs h-7 text-destructive" onClick={() => handleSuspend(p.id)}>
                      <AlertTriangle className="w-3 h-3 mr-1" /> Suspender
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="bg-card rounded-2xl border overflow-hidden mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Profissional</TableHead>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.client_name}</TableCell>
                      <TableCell className="text-xs">{r.professional_name}</TableCell>
                      <TableCell className="text-xs capitalize">{r.category?.replace(/_/g, ' ')}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{r.status}</Badge></TableCell>
                      <TableCell className="text-xs">{r.created_date && format(new Date(r.created_date), 'dd/MM/yy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}