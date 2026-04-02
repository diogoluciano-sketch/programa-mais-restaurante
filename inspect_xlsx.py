import pandas as pd
import sys

file_path = r'c:\Users\diogo.luciano\apps_criados\google_ai_studio\programa-mais-restaurante\planilha-cardapio\PL - 04 Cardápio PL Abril 2026.xlsx'
output_file = r'c:\Users\diogo.luciano\apps_criados\google_ai_studio\programa-mais-restaurante\xlsx_inspection.txt'

try:
    df = pd.read_excel(file_path)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("Columns: " + str(df.columns.tolist()) + "\n\n")
        subset = df.iloc[0:30]
        for i, row in subset.iterrows():
            clean_row = {k: v for k, v in row.to_dict().items() if pd.notna(v)}
            f.write(f"Row {i}: {clean_row}\n")
    print(f"Inspection written to {output_file}")
except Exception as e:
    print(f"Error reading Excel: {e}")
    sys.exit(1)
