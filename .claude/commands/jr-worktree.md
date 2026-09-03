---
description: Crea un git worktree aislado en .trees/[nombre] y ejecuta ahí las instrucciones recibidas
argument-hint: <descripción del requerimiento>
allowed-tools: Bash(git worktree:*), Bash(git branch:*), Bash(git status:*), Bash(cd:*), Bash(ls:*)
---

Requerimiento del usuario: $ARGUMENTS

Pasos a ejecutar:

1. Deriva un nombre corto en kebab-case (2-4 palabras, sin acentos, minúsculas) que represente el requerimiento. Este será `[nombre]`.
2. Verifica que `.trees/[nombre]` no exista ya (`git worktree list`). Si el nombre choca, agrega un sufijo numérico.
3. Crea el worktree con una rama nueva del mismo nombre, partiendo de la rama actual:
   ```
   git worktree add .trees/[nombre] -b [nombre]
   ```
4. A partir de ahí, todo el trabajo para este requerimiento se ejecuta DENTRO de `.trees/[nombre]` (usando esa ruta como directorio de trabajo para los comandos siguientes), de forma aislada del checkout principal — no toques archivos fuera de ese worktree.
5. Ejecuta el requerimiento descrito arriba dentro de ese worktree: lee el código relevante, implementa los cambios, corre pruebas/lint si aplica.
6. Al terminar, resume qué se hizo y en qué worktree/rama quedó, y recuerda al usuario que el worktree sigue vivo en `.trees/[nombre]` hasta que se elimine con `git worktree remove .trees/[nombre]`.

No mezcles cambios de este requerimiento con el checkout principal.
