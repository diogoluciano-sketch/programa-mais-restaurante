# Tarefa: Menu Dinâmico e Google Auth no Programa Mais Restaurante

Este plano detalha a implementação do cardápio dinâmico via upload de planilha e a autenticação obrigatória via Google para confirmação de presença (RSVP).

## 🎯 Requisitos
- **Autenticação**: Integrar Google Sign-In no Firebase.
- **Admin UI**: Criar área para upload manual de planilha `.xlsx` (Abril 2026).
- **Processamento**: Ler e processar o arquivo Excel para extrair o cardápio por data.
- **Armazenamento**: Persistir o cardápio em uma coleção `menu` no Firestore.
- **Frontend**: Exibir apenas o cardápio do dia atual no `MenuCard`.
- **RSVP**: Usar o nome do usuário logado diretamente no RSVP.

## 🛠️ Fases

### Fase 1: Autenticação (Firebase Google Auth)
1.  **Configuração Firebase**: Habilitar Google Provider (confirmar no console Firebase).
2.  **Auth Component**: `src/components/AuthContainer.tsx`.
3.  **Auth State Hook**: `src/hooks/useAuth.ts`.
4.  **UI Content Gate**: Proteger as rotas para exigir login Google antes do RSVP.

### Fase 2: Gestão de Cardápio (Admin & Excel)
1.  **Admin Page**: `src/pages/Admin.tsx` para o upload da planilha.
2.  **Excel Parser Service**: Lógica com a biblioteca `xlsx` para processar a estrutura do arquivo `PL - 04 Cardápio PL Abril 2026.xlsx`.
3.  **Firestore Sync**: Salvar cada dia do cardápio como um documento individual na coleção `menu` indexado pela data.

### Fase 3: Exibição Dinâmica (Consumer UI)
1.  **Menu Service**: Hook `useMenu` para buscar o cardápio do dia.
2.  **Update MenuCard**: Substituir os dados "mock" por chamadas dinâmicas.
3.  **Update RSVP**: Preencher automaticamente o campo de nome com o `displayName` do Firebase Auth.

---
**Status Atual:** Mapeamento de colunas confirmado. Iniciando Fase 1 (Autenticação Google com restrição de domínio @programaleiloes.com).

### 📋 Mapeamento Confirmado (Excel -> Firestore):
- **Data**: `Unnamed: 0`
- **Entrada/Salada**: `Unnamed: 10, 11, 12`
- **Prato Principal**: `Unnamed: 5, 6`
- **Acompanhamentos**: `Unnamed: 3, CARDÁPIO, 8, 9`
- **Sobremesa**: `Unnamed: 13`
- **Bebida**: `Unnamed: 14`
