# Tarefa: Melhorias no Painel Administrativo - Programa Mais Restaurante

Este plano detalha as alterações solicitadas para o Painel Administrativo, focando em organização de layout e novas funcionalidades de relatório.

## 🎯 Escopo
1.  **Layout**: Mover a seção "Upload de Cardápio" para o final da página.
2.  **Filtro de Dados**: Adicionar filtro por data na seção de "Pesquisas de Satisfação".
3.  **Exportação**: Implementar botão para exportar as pesquisas filtradas para um arquivo `.xlsx`.

## 🛠️ Plano de Ação

### Fase 1: Ajuste de Layout
- [x] No arquivo `src/pages/Admin.tsx`, identificar o Card de "Upload de Cardápio".
- [x] Reposicionar o bloco JSX para que ele apareça após a seção de "Pesquisas de Satisfação".

### Fase 2: Filtro de Pesquisas
- [x] Adicionar estado `filterDate` (string ou Date) para controlar o filtro.
- [x] Implementar um componente de seleção de data (DatePicker ou Input type="date") no cabeçalho da seção de pesquisas.
- [x] Criar memoizada `filteredSurveys` que aplica o filtro à lista original.

### Fase 3: Exportação para Excel
- [x] Criar função `exportSurveysToExcel`.
- [x] Mapear os campos das pesquisas (Data, Usuário, Notas, Comentário) para o formato do Excel.
- [x] Integrar o botão de exportação na UI.

---
**Status:** Concluído.
