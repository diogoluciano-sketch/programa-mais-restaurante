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

### Fase 1: Autenticação (Firebase Google Auth) - ✅ CONCLUÍDO
1.  **Configuração Firebase**: Habilitar Google Provider (confirmar no console Firebase).
2.  **Auth Component**: `src/components/AuthContainer.tsx`.
3.  **Auth State Hook**: `src/hooks/useAuth.ts`.
4.  **UI Content Gate**: Proteger as rotas para domínio `@programaleiloes.com`.

### Fase 2: Gestão de Cardápio (Admin & Excel) - ✅ CONCLUÍDO
1.  **Admin Page**: `src/pages/Admin.tsx` para o upload da planilha.
2.  **Excel Parser Service**: Lógica com `xlsx`.
3.  **Firestore Sync**: Persistência na coleção `menu`.

### Fase 3: Exibição Dinâmica (Consumer UI) - ✅ CONCLUÍDO
1.  **Menu Service**: Hook `useMenu`.
2.  **Update MenuCard**: Componentes dinâmicos.
3.  **Update RSVP**: Preenchimento automático do nome.

### Melhorias & Ajustes:
- [x] Botão de redirecionamento para Intranet no HeroSection. ✅
- [x] Mover Pesquisa de Satisfação para página própria (`/pesquisa`). ✅
- [x] Remover contador público de confirmações (RSVPs). ✅
- [x] Adicionar Fábio e Priscila como administradores do sistema. ✅

---
**Status Atual:** Concluído. O sistema agora possui gestão dinâmica de cardápios, pesquisa de satisfação dedicada e administradores múltiplos.

### 📋 Mapeamento Confirmado (Excel -> Firestore):
- **Data**: `Unnamed: 0`
- **Entrada/Salada**: `Unnamed: 10, 11, 12`
- **Prato Principal**: `Unnamed: 5, 6`
- **Acompanhamentos**: `Unnamed: 3, CARDÁPIO, 8, 9`
- **Sobremesa**: `Unnamed: 13`
- **Bebida**: `Unnamed: 14`
