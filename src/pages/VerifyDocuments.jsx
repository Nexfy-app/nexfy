import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Check, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DOCUMENT_TYPES = [
  { id: 'certificate', label: 'Certificado', description: 'Certificado de curso ou especialização' },
];

const STATUS_COLORS = {
  pending: { bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock, color: 'text-amber-600' },
  approved: { bg: 'bg-green-50', border: 'border-green-100', icon: Check, color: 'text-green-600' },
  rejected: { bg: 'bg-red-50', border: 'border-red-100', icon: X, color: 'text-red-600' },
};

function DocumentCard({ doc, onDelete }) {
  const Icon = STATUS_COLORS[doc.status].icon;
  
  return (
    <div className={`rounded-2xl p-4 border ${STATUS_COLORS[doc.status].bg} ${STATUS_COLORS[doc.status].border}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <Icon className={`w-4 h-4 mt-1 ${STATUS_COLORS[doc.status].color}`} />
          <div>
            <p className="font-semibold text-sm text-foreground">{doc.document_name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {DOCUMENT_TYPES.find(t => t.id === doc.document_type)?.label}
            </p>
          </div>
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full",
          doc.status === 'approved' ? 'bg-green-100 text-green-700' :
          doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700'
        )}>
          {doc.status === 'approved' ? '✓ Aprovado' : doc.status === 'rejected' ? '✗ Rejeitado' : '⏳ Pendente'}
        </span>
      </div>

      {doc.admin_notes && (
        <p className="text-xs text-muted-foreground bg-white/50 rounded-lg px-2.5 py-1.5 mb-2 border border-white/50">
          📝 {doc.admin_notes}
        </p>
      )}

      <div className="flex items-center gap-2">
        <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
          Ver arquivo
        </a>
        {doc.status !== 'approved' && (
          <button onClick={() => onDelete(doc.id)} className="text-xs text-red-600 hover:underline ml-auto">
            Remover
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyDocuments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [professional, setProfessional] = useState(null);
  const [selectedType, setSelectedType] = useState('certificate');
  const [docName, setDocName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: myPro } = useQuery({
    queryKey: ['my-pro-verify', user?.email],
    queryFn: () => base44.entities.Professional.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['my-docs', professional?.id],
    queryFn: () => base44.entities.VerificationDocument.filter({ professional_id: professional.id }),
    enabled: !!professional?.id,
  });

  useEffect(() => {
    if (myPro?.length > 0) setProfessional(myPro[0]);
  }, [myPro]);

  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!docName.trim()) {
      toast.error('Descreva o documento antes de selecionar o arquivo');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    await base44.entities.VerificationDocument.create({
      professional_id: professional.id,
      professional_email: user.email,
      document_type: selectedType,
      document_name: docName.trim(),
      file_url,
    });

    // Notify admins
    base44.functions.invoke('notifyAdminsNewDocument', {
      data: { professional_email: user.email, document_name: docName.trim(), document_type: selectedType }
    }).catch(() => {});

    toast.success('Documento enviado para validação!');
    setDocName('');
    setSelectedType('certificate');
    if (fileInputRef.current) fileInputRef.current.value = '';
    queryClient.invalidateQueries({ queryKey: ['my-docs'] });
    setUploading(false);
  };

  const handleDelete = async (docId) => {
    await base44.entities.VerificationDocument.delete(docId);
    queryClient.invalidateQueries({ queryKey: ['my-docs'] });
  };

  const approvedDocs = documents.filter(d => d.status === 'approved');
  const pendingDocs = documents.filter(d => d.status === 'pending');
  const rejectedDocs = documents.filter(d => d.status === 'rejected');

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => navigate('/profile')}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold">Validação de Documentos</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Info banner */}
         <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
           <p className="text-sm font-semibold text-blue-900 mb-1">🔒 Por que validar?</p>
           <p className="text-xs text-blue-700 leading-relaxed">
             Envie certificados de cursos, especialização ou qualificação profissional para gerar confiança nos clientes. Após aprovação do admin, seu perfil receberá um selo de "Verificado".
           </p>
         </div>

        {/* Approved documents */}
        {approvedDocs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-foreground">Documentos Aprovados</h2>
            </div>
            <div className="space-y-2">
              {approvedDocs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Pending documents */}
        {pendingDocs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-foreground">Aguardando Análise</h2>
            </div>
            <div className="space-y-2">
              {pendingDocs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Rejected documents */}
        {rejectedDocs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <X className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-foreground">Rejeitados</h2>
            </div>
            <div className="space-y-2">
              {rejectedDocs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Upload section */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="font-bold text-foreground mb-4">Enviar novo documento</h2>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Tipo de documento</label>
              <div className="grid grid-cols-3 gap-2">
                {DOCUMENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-left",
                      selectedType === type.id
                        ? "border-foreground bg-foreground/5"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <p className="text-xs font-semibold text-foreground">{type.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Descrição</label>
              <Input
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="Ex: Certificado de Python - Coursera"
                  className="rounded-xl"
                />
            </div>

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-slate-400 transition"
            >
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png" />
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-foreground">Selecionar arquivo</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">PDF, JPG, PNG (máx 5MB)</p>
              {uploading && <p className="text-[10px] text-blue-600 font-semibold mt-1">Enviando...</p>}
            </div>
          </div>

          <Button
            onClick={() => !uploading && docName.trim() && fileInputRef.current?.click()}
            disabled={uploading || !docName.trim()}
            className="w-full h-11 rounded-xl font-semibold"
          >
            {uploading ? 'Enviando...' : 'Enviar Documento'}
          </Button>
        </div>

        {/* Info about verification */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-foreground mb-2">📋 Como funciona?</p>
          <ul className="text-[11px] text-muted-foreground space-y-1 leading-relaxed">
            <li>• Envie certificados de cursos, especialização ou qualificação</li>
            <li>• Nosso time valida em até 48 horas</li>
            <li>• Após aprovação, seu perfil ganha o selo "Verificado" ✓</li>
            <li>• Aumente sua credibilidade com clientes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}