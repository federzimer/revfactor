# Hamburger to X — Animated Icon (React + CSS)

## Concepto

El icono es un contenedor de 18x18px con **3 barras horizontales** (`<span>`). Cuando `menuOpen` es `true`, las barras se animan con CSS transitions para formar una **X**:

- **Barra superior** -> se mueve al centro y rota 45deg (forma `\`)
- **Barra del medio** -> se desvanece (opacity 0)
- **Barra inferior** -> se mueve al centro y rota -45deg (forma `/`)

No se usan iconos de libreria, es 100% CSS.

---

## Estructura

```jsx
const [menuOpen, setMenuOpen] = useState(false);

<button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
  <div className="relative w-[18px] h-[18px]">
    {/* Barra superior */}
    <span
      className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current"
      style={{
        top: menuOpen ? '8.25px' : '3.25px',
        transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        transition: 'top 300ms cubic-bezier(0.25,0.1,0.25,1), transform 300ms cubic-bezier(0.25,0.1,0.25,1)',
      }}
    />
    {/* Barra del medio */}
    <span
      className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current top-[8.25px]"
      style={{
        opacity: menuOpen ? 0 : 1,
        transition: 'opacity 200ms cubic-bezier(0.25,0.1,0.25,1)',
      }}
    />
    {/* Barra inferior */}
    <span
      className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current"
      style={{
        top: menuOpen ? '8.25px' : '13.25px',
        transform: menuOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
        transition: 'top 300ms cubic-bezier(0.25,0.1,0.25,1), transform 300ms cubic-bezier(0.25,0.1,0.25,1)',
      }}
    />
  </div>
</button>
```

---

## Como funciona paso a paso

### Estado cerrado (hamburger)

```
top: 3.25px    ────  (barra superior)
top: 8.25px    ────  (barra del medio)
top: 13.25px   ────  (barra inferior)
```

Las 3 barras estan espaciadas equidistantemente dentro del contenedor de 18px. Cada barra tiene `h-[1.5px]` (grosor fino) y `left-[2px] right-[2px]` (un poco de margen a los costados, asi las barras son mas cortas que el contenedor).

### Estado abierto (X)

```
top: 8.25px + rotate(45deg)    ╲  (barra superior -> forma \)
top: 8.25px + opacity: 0           (barra del medio -> invisible)
top: 8.25px + rotate(-45deg)   ╱  (barra inferior -> forma /)
```

1. La barra superior se mueve de `3.25px` a `8.25px` (centro) y rota 45deg
2. La barra del medio se desvanece con opacity
3. La barra inferior se mueve de `13.25px` a `8.25px` (centro) y rota -45deg

Las dos barras que quedan visibles se cruzan en el centro formando la X.

---

## Detalles clave

### Posicionamiento
- El contenedor es `relative` y las barras son `absolute` -> permite mover las barras con `top`
- Todas convergen a `top: 8.25px` que es el centro vertical del contenedor de 18px (18/2 - 0.75 del grosor)

### Transitions
- `top` y `transform` se animan en 300ms
- `opacity` (barra del medio) se anima en 200ms (mas rapido, para que desaparezca antes de que las barras se crucen)
- Easing: `cubic-bezier(0.25, 0.1, 0.25, 1)` -> movimiento suave tipo ease-out

### Color
- `bg-current` hereda el `color` del boton padre. El boton cambia de color segun scroll state:
  - Sin scroll: `text-[#E8E6E1]` (claro, sobre fondo oscuro)
  - Con scroll: `text-[#3F261F]` (oscuro, sobre fondo claro)

---

## Version minima (sin Tailwind)

Si no usas Tailwind, lo mismo con CSS puro:

```css
.hamburger {
  position: relative;
  width: 18px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
}

.hamburger span {
  position: absolute;
  left: 2px;
  right: 2px;
  height: 1.5px;
  border-radius: 9999px;
  background: currentColor;
  transition: top 300ms cubic-bezier(0.25, 0.1, 0.25, 1),
              transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1),
              opacity 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
}

.hamburger span:nth-child(1) { top: 3.25px; }
.hamburger span:nth-child(2) { top: 8.25px; }
.hamburger span:nth-child(3) { top: 13.25px; }

/* Estado abierto */
.hamburger.open span:nth-child(1) { top: 8.25px; transform: rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { top: 8.25px; transform: rotate(-45deg); }
```

```html
<button class="hamburger" onclick="this.classList.toggle('open')">
  <span></span>
  <span></span>
  <span></span>
</button>
```

---

## Personalizacion rapida

| Que cambiar | Donde |
|---|---|
| Tamano del icono | `w-[18px] h-[18px]` en el contenedor |
| Grosor de las barras | `h-[1.5px]` en cada span |
| Ancho de las barras | `left-[2px] right-[2px]` (mas px = barras mas cortas) |
| Velocidad | Los `300ms` / `200ms` en las transitions |
| Color | `bg-current` hereda del padre, o usa `bg-[#color]` directo |
| Espaciado entre barras | Los valores de `top` (3.25, 8.25, 13.25) |
