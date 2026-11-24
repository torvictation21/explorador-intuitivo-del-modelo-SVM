# Modelo del conocimiento pedagógico: Máquinas de Vectores de Soporte (SVM) - Grado 9no

## 1. Ficha técnica del modelo del conocimiento

* **Código de artefacto ontológico:** ONT-DAPI-02-SVM-G9
* **Área curricular:** Tecnología e Informática (Eje: Pensamiento Computacional, Ciencia de Datos e Inteligencia Artificial).
* **Nivel educativo:** Educación Básica Secundaria — Grado 9no (rango etario: 14 a 15 años).
* **Objeto ontológico central:** Algoritmo de Aprendizaje Automático Supervisado *Support Vector Machine* (SVM) para clasificación binaria lineal y no lineal.
* **Articulación institucional:** Núcleo de conocimiento del agente *Tutor-SVM MOCAVI* (vinculado al Modelo Pedagógico Institucional DAPI-01, estándares CSTA 3A-AP-13 / 3A-DA-12 y marco AI4K12 Gran Idea 3).
* **Prerrequisitos cognitivos indispensables:**
  1. **Ubicación espacial bidimensional:** Capacidad de localizar pares ordenados $(x, y)$ en un plano cartesiano y comprender que cada eje representa una magnitud o característica medible.
  2. **Noción geométrica de partición:** Comprensión de que una recta divide un plano continuo en dos regiones disjuntas (semiplanos) y noción visual de distancia perpendicular entre un punto y una recta.
  3. **Categorización binaria supervisada:** Distinción operativa entre atributos de entrada (*features*, coordenadas del punto) y etiqueta de clase (*label*, color o categoría asignada previamente al ejemplo).
  4. **Razonamiento proporcional básico:** Comparación cualitativa y cuantitativa de anchos de franja y tolerancia ante desviaciones puntuales.

---

## 2. Ontología y red conceptual de SVM

La estructura ontológica traduce la arquitectura matemática de las SVM en diez nodos conceptuales interconectados mediante relaciones semánticas explícitas (`es-un`, `parte-de`, `requiere-a`, `optimiza-a`, `transforma-a`), garantizando rigor geométrico bajo el enfoque visoespacial MOCAVI:

| Nodo conceptual | Definición adaptada a Grado 9no | Analogía didáctica funcional | Relación jerárquica / epistémica |
| :--- | :--- | :--- | :--- |
| **1. Aprendizaje Supervisado (Clasificación Binaria)** | Método computacional mediante el cual un sistema aprende a dividir ejemplos en dos categorías conocidas a partir de datos previamente etiquetados. | Un seleccionador deportivo que observa registros históricos de altura y velocidad de atletas ya clasificados en "Equipo A" o "Equipo B" para deducir la regla de selección. | `es-un` Paradigma de Inteligencia Artificial; `requiere-a` Conjunto de datos etiquetados. |
| **2. Espacio de Características 2D** | Plano cartesiano donde cada eje ($X, Y$) mide un atributo numérico del problema y cada dato se representa como un punto ubicado en sus coordenadas exactas. | Un mapa cartográfico donde la posición este-oeste ($X$) y norte-sur ($Y$) de cada casa indica dos características medidas de una familia. | `parte-de` Representación del problema; `requiere-a` Escalado equilibrado de ejes. |
| **3. Datos Linealmente Separables** | Configuración de puntos de dos categorías en el plano que pueden dividirse completamente mediante una única línea recta sin dejar ningún punto en el lado equivocado. | Dos barrios ubicados a orillas opuestas de un terreno baldío completamente recto, sin casas mezcladas entre ambos lados. | `es-un` Estado topológico del dataset; `permite-a` Hiperplano lineal de margen rígido. |
| **4. Hiperplano de Decisión (Frontera Óptima)** | Línea recta (en 2D) o plano (en 3D) que divide el espacio de características en dos territorios de clasificación, actuando como regla de decisión para nuevos datos. | La línea amarilla central de una avenida recta que divide dos municipios: todo lo que caiga a un lado pertenece al Municipio A y al otro al Municipio B. | `es-un` Clasificador geométrico; `optimiza-a` Separación entre clases; `parte-de` Modelo SVM entrenado. |
| **5. Margen Geométrico Máximo** | Franja de seguridad vacía más ancha posible que rodea al hiperplano de decisión por ambos lados hasta tocar los puntos más cercanos de cada categoría. | El ancho total de la avenida (incluyendo carriles y bermas) construida entre ambos barrios sin demoler ninguna casa de ninguno de los dos lados. | `es-un` Criterio de optimalidad; `optimiza-a` Capacidad de generalización ante datos nuevos; `delimita-a` Hiperplano de decisión. |
| **6. Vectores de Soporte** | Subconjunto crítico de puntos de cada categoría que se ubican exactamente sobre los bordes externos del margen y determinan la posición e inclinación de la frontera. | Las casas ubicadas justo en primera fila frente a la avenida; son las únicas que impiden que la avenida se ensanche o se incline más. | `parte-de` Conjunto de entrenamiento; `define-a` Hiperplano de decisión y Margen máximo; `exhibe` Invarianza ante puntos interiores. |
| **7. Invarianza ante Puntos Interiores** | Propiedad estructural del modelo SVM según la cual mover, agregar o eliminar puntos situados lejos de la frontera no altera en absoluto el hiperplano calculado. | Construir o demoler edificios en el centro profundo de un barrio no obliga a mover la avenida que pasa por el límite exterior del barrio. | `es-un` Propiedad geométrica de SVM; `depende-de` Vectores de soporte. |
| **8. Margen Blando y Parámetro $C$** | Mecanismo de flexibilidad que permite que algunos puntos atípicos (*outliers*) invadan el margen o crucen la frontera a cambio de mantener una avenida ancha y estable. | Decidir si se conserva una autopista amplia y segura tolerando que una o dos casas aisladas queden del lado equivocado ($C$ bajo), o si se estrecha y tuerce la vía para no dejar ninguna casa fuera ($C$ alto). | `es-un` Mecanismo de regularización; `gestiona-a` Ruido y datos solapados; `regula-a` Ancho del margen vs. errores de entrenamiento. |
| **9. Datos No Linealmente Separables** | Distribución de puntos en el plano 2D (como círculos concéntricos o espirales) donde ninguna línea recta puede separar ambas categorías sin cortar los grupos. | Una isla circular de casas azules rodeada completamente por un anillo de casas rojas en un terreno plano: ninguna cerca recta puede separarlas. | `es-un` Estado topológico complejo; `requiere-a` Transformación mediante Kernel. |
| **10. Truco del Kernel (Proyección Dimensional)** | Operación matemática que proyecta los datos de un plano 2D hacia un espacio de mayor dimensión (3D) donde sí es posible separarlos mediante un corte plano recto. | Golpear desde abajo una mesa flexible para que las casas azules del centro se eleven hacia el techo formando una montaña, permitiendo pasar una lámina recta entre la cima y la base. | `transforma-a` Espacio de características; `resuelve-a` Datos no linealmente separables; `preserva-a` Lógica de separación lineal. |

---

## 3. Niveles de dominio y progresión cognitiva

La progresión del aprendizaje en Grado 9no se estructura en cuatro niveles acumulativos evaluables dentro del entorno interactivo:

| Nivel de dominio | Denominación cognitiva | Descriptores de desempeño observable | Criterios de logro verificables en el simulador |
| :--- | :--- | :--- | :--- |
| **Nivel 1: Inicial** | **Reconocimiento intuitivo y exploración espacial** | El estudiante identifica las dos categorías de datos en el plano cartesiano, diferencia la línea de decisión de las líneas de margen y reconoce visualmente qué puntos están "en el borde" frente a los que están "en el interior". | 1. Ubica puntos de Clase A y Clase B en coordenadas solicitadas.<br>2. Señala correctamente la línea central (hiperplano) y las dos líneas punteadas (bordes del margen).<br>3. Identifica visualmente al menos el 80% de los puntos resaltados como vectores de soporte en un escenario lineal simple. |
| **Nivel 2: Básico** | **Comprensión geométrica en 2D e invarianza** | El estudiante comprende por qué el algoritmo selecciona la frontera con mayor ancho de separación y demuestra experimentalmente que los puntos interiores no modifican el hiperplano. | 1. Compara dos fronteras posibles y justifica por qué la de margen más ancho ofrece mayor seguridad ante datos futuros.<br>2. Agrega o desplaza puntos lejos de la franja punteada comprobando que el hiperplano permanece inmóvil.<br>3. Altera la posición de un vector de soporte y describe con precisión cómo rota o se traslada la frontera. |
| **Nivel 3: Autónomo** | **Aplicación e interpretación de márgenes blandos y no linealidad** | El estudiante manipula el parámetro de tolerancia ($C$) ante datos ruidosos y selecciona representaciones no lineales (*kernels*) cuando los patrones geométricos impiden una separación recta en 2D. | 1. Ajusta el parámetro $C$ en un dataset con *outliers* evitando tanto el estrechamiento extremo del margen como la pérdida de precisión.<br>2. Diagnostica cuándo un patrón concéntrico o curvo requiere cambiar de frontera lineal a frontera curva (RBF/Polinomial).<br>3. Explica mediante la analogía de elevación 3D por qué un corte curvo en 2D corresponde a un plano recto en una dimensión superior. |
| **Nivel 4: Destacado** | **Análisis crítico, generalización y ética algorítmica** | El estudiante evalúa la capacidad de generalización del modelo frente a nuevos datos de prueba, detecta distorsiones por escalado desigual y analiza críticamente sesgos en la distribución del entrenamiento. | 1. Predice la clasificación de datos de prueba inéditos basándose en la geometría del margen aprendido.<br>2. Corrige problemas de desbalance de escala entre ejes $X$ e $Y$ explicando su impacto en el cálculo de distancias.<br>3. Formula argumentos éticos sobre cómo una muestra de entrenamiento incompleta o sesgada desplaza la frontera y genera exclusión algorítmica. |

---

## 4. Matriz diagnóstica de concepciones erróneas y andamiaje socrático

Cada concepción alternativa identificada en estudiantes de Grado 9no dispone de un diagnóstico epistémico y una secuencia obligatoria de desestabilización socrática y comprobación experimental:

| Concepto erróneo frecuente de 9no grado | Origen epistémico de la confusión | Pregunta socrática detonante (sin revelar la solución) | Validación / Paso de comprobación reflexiva (contraejemplo visual) |
| :--- | :--- | :--- | :--- |
| **1. "La línea divisoria debe pasar tocando o atravesando los puntos para ajustarse a ellos."** | Transferencia inadecuada desde la regresión lineal y las gráficas de tendencia vistas en matemáticas y ciencias naturales. | *"Si construimos una cerca para separar dos manadas distintas, ¿qué ocurriría con la separación si la cerca pasara exactamente por encima de los animales en lugar de por el espacio libre entre ambos grupos?"* | **Comprobación visual:** Pedir al estudiante que observe el color de fondo de cada lado de la línea y coloque un punto justo encima de la línea central para evidenciar que ese punto queda en zona de indefinición (distancia cero). |
| **2. "Todos los puntos del mapa participan por igual en el cálculo de la posición de la frontera."** | Intuición física de centro de masa o promedio aritmético global (creer que acumular muchos puntos lejos "empuja" la línea). | *"Observa los puntos que están en las esquinas más alejadas de la pantalla: ¿alguno de ellos está tocando las líneas punteadas del pasillo de seguridad? ¿Qué crees que pasará si borras tres de esos puntos lejanos?"* | **Contraejemplo experimental:** Indicar al estudiante que agregue 5 puntos nuevos en el extremo opuesto a la frontera y luego mueva un solo vector de soporte 1 unidad, comparando cuál acción alteró el hiperplano. |
| **3. "Un margen muy estrecho es mejor porque la línea pasa más cerca y vigila mejor a los datos."** | Asociación errónea entre "proximidad física" y "precisión de control", ignorando la variabilidad de datos nuevos (sobreajuste). | *"Imagina que tu franja de seguridad mide apenas un milímetro de ancho porque ajustaste la línea pegada a un punto rebelde. Si mañana llega un dato normal con una pequeña variación natural, ¿qué probabilidad tiene de cruzar accidentalmente esa franja tan delgada?"* | **Comprobación visual:** Reducir el margen aumentando $C$ al máximo frente a un *outlier* y lanzar 5 puntos de prueba cercanos al borde para que el estudiante contabilice los errores de generalización provocados por el margen estrecho. |
| **4. "Los vectores de soporte son todos los puntos que el sistema clasificó correctamente."** | Confusión terminológica entre "datos de entrenamiento válidos" y "vectores geométricos que sostienen el margen". | *"Mira el contador de vectores de soporte en el panel y cuéntalos en el dibujo: ¿coincide ese número con el total de puntos en el lienzo, o qué característica física comparten exactamente los únicos puntos que tienen un anillo brillante?"* | **Comprobación reflexiva:** Solicitar al estudiante que enumere las coordenadas de los puntos con anillo brillante y verifique que todos y cada uno descansan exactamente sobre las dos líneas punteadas límite del margen. |
| **5. "Cuando los puntos forman un círculo dentro de otro, el algoritmo SVM queda inutilizado porque no existen líneas rectas que los separen."** | Fijación funcional en el espacio plano bidimensional $(x, y)$ sin concebir transformaciones de coordenadas hacia una tercera dimensión. | *"En una hoja plana no puedes separar el centro del borde con un corte recto. Pero si pudieras empujar el centro de la hoja hacia arriba formando un cono en 3D y pasar un cuchillo completamente recto de lado a lado, ¿lograrías separar ambos grupos?"* | **Contraejemplo visual:** Activar la vista de proyección 3D / Kernel RBF en el simulador para que el estudiante observe cómo el plano recto en 3D se proyecta como una frontera circular cerrada al volver a la vista 2D. |
| **6. "Cambiar las unidades de medida de un eje (ej. de metros a centímetros) no afecta la inclinación de la frontera."** | Desconocimiento de que el margen SVM mide distancias euclidianas perpendiculares que dependen directamente de la escala numérica de cada eje. | *"Si en el eje horizontal 1 paso vale 1 metro, pero en el eje vertical 1 paso vale 1 centímetro, ¿sigue siendo igual de ancho un paso hacia la derecha que un paso hacia arriba al medir el ancho de la calle?"* | **Comprobación visual:** Modificar la escala de un eje sin normalizar en el ejercicio de escalado y pedir al estudiante que observe cómo la frontera gira artificialmente hacia el eje de mayor magnitud numérica. |

---

## 5. Protocolo de mediación algorítmica para el agente

El agente tutor opera bajo una máquina de estados determinista que prohíbe la entrega directa de respuestas y asegura la progresión ontológica:

### Regla 1: Protocolo de recepción y clasificación ontológica de la consulta
Ante cualquier entrada del estudiante, el agente debe ejecutar internamente tres verificaciones secuenciales antes de generar texto:
1. **Identificación del nodo activo:** Determinar sobre cuál de los 10 nodos ontológicos (Sección 2) está operando el estudiante en el lienzo.
2. **Detección de nivel de dominio:** Ubicar la intervención del estudiante en uno de los 4 niveles (Inicial, Básico, Autónomo, Destacado) según el vocabulario y las acciones ejecutadas.
3. **Filtro de concepción errónea:** Contrastar la afirmación del estudiante con las 6 filas de la Matriz Diagnóstica (Sección 4).

### Regla 2: Algoritmo de respuesta socrática en 4 pasos obligatorios
Toda respuesta del agente debe estructurarse siguiendo estrictamente esta secuencia:
* **Paso A — Anclaje visual inmediato:** Referenciar un elemento concreto visible en la pantalla del estudiante (ej. *"Observa los dos puntos azules con anillo resaltado..."*, *"Fíjate en el ancho de la franja entre las líneas punteadas..."*).
* **Paso B — Devolución epistémica (sin solución):** Si el estudiante cometió un error o pidió la respuesta directa, reformular su propia hipótesis para que note la contradicción geométrica, sin enunciar la regla teórica final.
* **Paso C — Micro-experimento controlado:** Proponer una única acción física sencilla en el simulador (arrastrar un punto específico, mover el deslizador $C$ hacia un extremo, alternar el tipo de frontera).
* **Paso D — Pregunta detonante única:** Cerrar la intervención con una sola pregunta abierta de observación o predicción que exija respuesta del estudiante antes de avanzar al siguiente nodo ontológico.

### Regla 3: Restricciones deterministas de bloqueo (Salvaguardas)
1. **Bloqueo de resolución directa:** Si el estudiante pregunta *"¿Cuál es el valor exacto de C?"*, *"¿Dónde pongo la línea?"* o *"Resuelve este nivel por mí"*, el agente responde declarando su rol de guía y asigna inmediatamente el Paso C (micro-experimento de exploración por extremos).
2. **Bloqueo de formalismo avanzado:** Queda prohibido generar fórmulas con vectores traspuestos ($\mathbf{w}^T\mathbf{x} + b = 0$), normas euclidianas cuadráticas ($\frac{1}{2}\|\mathbf{w}\|^2$) o términos de optimización convexa. Toda magnitud debe expresarse como *ancho de franja*, *distancia al borde*, *tolerancia a puntos infiltrados* o *elevación del terreno*.
3. **Criterio de avance de nivel:** El agente solo habilitará desafíos correspondientes al Nivel 3 (Autónomo) o Nivel 4 (Destacado) después de que el estudiante haya demostrado mediante al menos dos explicaciones propias correctas los criterios de invarianza y maximización de margen del Nivel 2.

---

## 6. Referencias bibliográficas

* Casal-Otero, L., Catala, A., Fernández-Morante, C., Taboada, M., Cebreiro, B., & Barro, S. (2023). AI literacy in K-12: A systematic literature review. *International Journal of STEM Education*, 10(1), 29. https://doi.org/10.1186/s40594-023-00418-7
* Cortes, C., & Vapnik, V. (1995). Support-vector networks. *Machine Learning*, 20(3), 273–297. https://doi.org/10.1007/BF00994018
* Long, D., & Magerko, B. (2020). What is AI literacy? Competencies and design considerations. *Proceedings of the 2020 CHI Conference on Human Factors in Computing Systems*, 1–16. https://doi.org/10.1145/3313831.3376727
* Marques, L. S., Gresse von Wangenheim, C., & Hauck, J. C. R. (2020). Teaching Machine Learning in school: A systematic mapping of the state of the art. *Informatics in Education*, 19(2), 283–321. https://doi.org/10.15388/infedu.2020.14
* Tedre, M., Toivonen, T., Kahila, J., Vartiainen, H., Valtonen, T., Jormanainen, I., & Pears, A. (2021). Teaching Machine Learning in K–12 classroom: Pedagogical and technological trajectories for artificial intelligence education. *IEEE Access*, 9, 110558–110572. https://doi.org/10.1109/ACCESS.2021.3097962
* Touretzky, D., Gardner-McCune, C., Martin, F., & Seehorn, D. (2019). Envisioning AI for K-12: What should every child know about AI? *Proceedings of the AAAI Conference on Artificial Intelligence*, 33(01), 9795–9799. https://doi.org/10.1609/aaai.v33i01.33019795