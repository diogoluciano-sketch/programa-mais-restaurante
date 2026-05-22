import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isUserAdmin } from "@/lib/constants";
import { usePrestadores, Prestador, FUNCOES } from "@/hooks/usePrestadores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const emptyForm = (): Omit<Prestador, "id"> => ({
  nome: "",
  cpf: "",
  telefone: "",
  funcao: "",
});

const Prestadores = () => {
  const { user, loading } = useAuth();
  const { prestadores, add, update, remove } = usePrestadores();
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);

  if (loading) return null;
  if (!isUserAdmin(user?.email)) {
    window.location.href = "/";
    return null;
  }

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.funcao) {
      toast.error("Nome e função são obrigatórios.");
      return;
    }
    try {
      if (editId) {
        await update(editId, form);
        toast.success("Prestador atualizado.");
        setEditId(null);
      } else {
        await add(form);
        toast.success("Prestador cadastrado.");
      }
      setForm(emptyForm());
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const startEdit = (p: Prestador) => {
    setEditId(p.id!);
    setForm({ nome: p.nome, cpf: p.cpf, telefone: p.telefone, funcao: p.funcao });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(emptyForm());
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prestadores de Serviço</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de equipe para atendimento nos leilões
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold">
          {editId ? "Editar Prestador" : "Novo Prestador"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Função *</Label>
            <Select
              value={form.funcao}
              onValueChange={(v) => setForm((f) => ({ ...f, funcao: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar função..." />
              </SelectTrigger>
              <SelectContent>
                {FUNCOES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>CPF</Label>
            <Input
              value={form.cpf}
              onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input
              value={form.telefone}
              onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} className="gap-2">
            {editId ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {editId ? "Atualizar" : "Cadastrar"}
          </Button>
          {editId && (
            <Button variant="outline" onClick={cancelEdit} className="gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {prestadores.length > 0 ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestadores.map((p) => (
                <TableRow
                  key={p.id}
                  className={editId === p.id ? "bg-muted/50" : ""}
                >
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell>{p.funcao}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.cpf || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.telefone || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(p)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover prestador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {p.nome} será removido do cadastro. Esta ação não
                              pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                remove(p.id!).then(() =>
                                  toast.success("Prestador removido.")
                                )
                              }
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            Nenhum prestador cadastrado ainda.
          </p>
        </div>
      )}
    </div>
  );
};

export default Prestadores;
