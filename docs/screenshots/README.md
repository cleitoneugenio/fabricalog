# Mídia do README

| Arquivo | Uso |
|---|---|
| `fabricalog-demo.gif` | Preview animado exibido inline no README (300px, 8 fps, ~3.6 MB) |
| `fabricalog-demo.mp4` | Fonte em qualidade original (420×844, 25 fps) — regenerar o GIF a partir daqui |

## Regenerar o GIF a partir do MP4

```bash
ffmpeg -i fabricalog-demo.mp4 \
  -vf "fps=8,scale=300:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4" \
  fabricalog-demo.gif
```

## Upgrade opcional para player de vídeo inline

O GitHub só renderiza player de vídeo para arquivos enviados como anexo.
Para trocar o GIF por um vídeo com controles: editar o `README.md` pela
interface web do GitHub, arrastar `fabricalog-demo.mp4` para dentro do
editor e colar a URL `github.com/user-attachments/assets/...` gerada.

## Screenshots estáticas (ainda não adicionadas)

Se quiser complementar com telas fixas: `dashboard.png`, `forno.png`,
`ponto.png` (máx. ~1200px, PNG otimizado) e referenciar em uma seção
`## Screenshots` no README.
