# 🏋️ GymApp — Treino Gamificado & Dieta Personalizada (PWA)

Aplicativo web progressivo (**PWA**) instalável no celular (Android e iPhone) e 100% funcional offline na academia, desenvolvido em **React + TypeScript + Vite + Tailwind CSS + Zustand + Framer Motion**.

---

## ✨ Principais Funcionalidades

1. **Perfis Personalizados & Cálculos Fisiológicos (`Mateus` e `Helen`):**
   - Cálculo automático de **IMC**, **TMB** (Mifflin-St Jeor), **GET** (Gasto Energético Total), **Meta Calórica** (Recomposição/Déficit ou Hipertrofia/Superávit), **Divisão de Macronutrientes** (Proteína, Carboidrato e Gordura) e **Meta Diária de Água**.
   - Ao registrar um novo peso corporal na aba **Perfil**, todas as metas calóricas, de macros e de água se recalibram sozinhas!

2. **Fichas ABC / ABCD Inteligentes:**
   - Banco com **71 exercícios** comuns em academias brasileiras, com dicas de execução e lista de exercícios equivalentes.
   - Respeita o limite de **80 minutos (1h20)** por sessão e destaca os 3 principais exercícios compostos (⭐ *Bons para começar*).

3. **Fluxo de Treino Estilo Duolingo (Modo Foco):**
   - **Check-in de Energia (Autorregulação):**
     - 🔥 *Energia Alta:* treino completo + sugestão automática de `+2 kg` nas cargas anteriores.
     - 😐 *Normal:* segue a ficha padrão.
     - 🪫 *Modo Sobrevivência:* reduz 1 série por exercício e corta acessórios/cardio finais para você não perder o hábito em dias cansativos ou corridos.
   - **Escolha por onde começar:** olhe ao redor na academia e toque no exercício composto que estiver livre.
   - **1 Exercício por Tela:** botões grandes para usar com a mão suada, cronômetro de descanso automático com bipe sonoro nos 3 segundos finais e botão **"Aparelho Ocupado ⏳"** (joga o exercício para o fim da fila ou substitui na hora por um equivalente).

4. **Gamificação Realista para Musculação:**
   - **Ofensiva Semanal (Chama):** conta semanas consecutivas batendo sua meta de treinos (sem punir seus dias de descanso!).
   - **Sistema de XP e Níveis**, **Detecção de Recordes Pessoais (PRs)** e **Alerta de Sobrecarga Progressiva** (*"🔥 Hora de subir +2 kg hoje!"*).

5. **Dieta & Calculadora de Substituição (Tabela TACO):**
   - Cardápio diário em 4 refeições calculado automaticamente para bater seus macros.
   - **Calculadora de Equivalência:** troque qualquer alimento (ex: *Arroz* por *Batata-doce* ou *Macarrão*; *Frango* por *Tilápia* ou *Patinho*) com a gramagem exata calculada na hora.
   - **Encaixe Flexível:** encaixe uma porção calculada de chocolate meio amargo, doce de leite ou pão de queijo sem estourar as calorias do dia.

6. **Gráficos de Evolução & Backup JSON:**
   - Gráficos de **Peso Corporal**, **Volume Total por Sessão (kg)** e **Carga Máxima por Exercício**.
   - Exportação e importação de **Backup `.json`** para nunca perder seus dados.

---

## 🚀 Como Publicar de Graça no GitHub Pages (3 minutos)

1. Crie um repositório no seu GitHub (ex: `gym-app`).
2. Na pasta deste projeto, envie o código para lá:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/gym-app.git
   git push -u origin main
   ```
3. No GitHub, abra seu repositório e vá em **Settings → Pages**.
4. Em **Build and deployment → Source**, selecione **GitHub Actions**.
5. Pronto! O workflow `.github/workflows/deploy.yml` vai compilar e publicar seu app automaticamente em `https://SEU-USUARIO.github.io/gym-app/`.

---

## 📱 Como Instalar no Celular

- **No Android (Chrome):**
  1. Abra o link do seu GitHub Pages no Chrome.
  2. Toque no menu `⋮` (canto superior direito) e escolha **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
- **No iPhone (Safari):**
  1. Abra o link do seu GitHub Pages no Safari.
  2. Toque no botão **Compartilhar** (quadrado com seta para cima na barra inferior) e escolha **"Adicionar à Tela de Início"**.

---

## 🛠️ Comandos para Rodar Localmente

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento (acessível no PC e no Wi-Fi)
npm run dev -- --host

# Rodar todos os testes automatizados (Vitest)
npm test

# Gerar versão de produção na pasta dist/
npm run build
```
