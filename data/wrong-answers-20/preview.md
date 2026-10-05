# 真实错题数据预览

所有学生与来源名称均为匿名别名。评分和评语保持历史原值。


## wrong_001 · CALCULATION

学生：student_001；课程：线性代数 · 示例班 001；得分：8.36/10

知识点：未标注


### 题干

写出四阶行列式
$$\begin{vmatrix}
a_{11} & \cdots & a_{14} \\
\vdots & & \vdots \\
a_{41} & \cdots & a_{44}
\end{vmatrix}$$
中一切带有负号且含元素$a_{23}$的项。


### 原始文本作答

```html

<p>-a<sub>11</sub>a<sub>23</sub>a<sub>32</sub>a<sub>44</sub></p><p>-a<sub>12</sub>a<sub>23</sub>a<sub>34</sub>a<sub>41</sub></p><p>-a<sub>14</sub>a<sub>23</sub>a<sub>31</sub>a<sub>42</sub></p><p>-a<sub>14</sub>a<sub>23</sub>a<sub>32</sub>a<sub>41</sub></p>

```


### 公开评语

该题学生核心逻辑正确，完整列出了3个符合要求的带负号含a₂₃的项，仅多写1个符号错误的额外项，可。最终记8.36分。


## wrong_002 · CALCULATION

学生：student_001；课程：线性代数 · 示例班 001；得分：2.62/10

知识点：未标注


### 题干

根据行列式定义计算$n$阶行列式：
$$\begin{vmatrix}
0 & 1 & 0 & \cdots & 0 \\
0 & 0 & 2 & \cdots & 0 \\
\vdots & \vdots & \vdots & & \vdots \\
0 & 0 & 0 & \cdots & n-1 \\
n & 0 & 0 & \cdots & 0
\end{vmatrix}$$


### 原始文本作答

```html

<p>(−1)<sup>n−1</sup>n!</p>

```


### 公开评语

该题仅提交正确最终结果，无任何推导过程，按评分标准。最终记2.62分。


## wrong_003 · CALCULATION

学生：student_001；课程：线性代数 · 示例班 001；得分：8.36/10

知识点：未标注


### 题干

计算下列$n$阶行列式的值.

$D_{n} = \begin{vmatrix} x & a & \cdots & a \\ a & x & \cdots & a \\ \vdots & \vdots & & \vdots \\ a & a & \cdots & x \end{vmatrix}$


### 原始文本作答

```html

<p>[x+(n−1)a](x−a)<sup>n-1</sup></p>

```


### 公开评语

该题最终计算结果正确，未提供解题推导过程，。最终记8.36分。


## wrong_004 · CALCULATION

学生：student_001；课程：线性代数 · 示例班 001；得分：8.36/10

知识点：未标注


### 题干

计算下列$n$阶行列式的值.

$D_{n} = \begin{vmatrix} 1 & -1 & \cdots & -1 & -1 \\ 1 & 1 & \cdots & -1 & -1 \\ \vdots & \vdots & & \vdots & \vdots \\ 1 & 1 & \cdots & 1 & -1 \\ 1 & 1 & \cdots & 1 & 1 \end{vmatrix}$


### 原始文本作答

```html

<p>2<sup>n-1</sup></p>

```


### 公开评语

该题最终计算结果正确，但未提供推导过程，步骤分不予计入，。最终记8.36分。


## wrong_005 · CALCULATION

学生：student_001；课程：线性代数 · 示例班 001；得分：3.44/10

知识点：未标注


### 题干

利用行列式性质计算下列行列式.

$$\begin{vmatrix} 3421 & 3521 \\ 2809 & 2909 \end{vmatrix}$$


### 原始文本作答

```html

<p>61200</p>

```


### 公开评语

该题仅提交正确的最终结果，未展示计算过程，，待人工复核过程得分。最终记3.44分。


## wrong_006 · CALCULATION

学生：student_002；课程：线性代数 · 示例班 002；得分：6.72/10

知识点：未标注


### 题干

已知$\begin{vmatrix} a_{11} & a_{12} & a_{13} \\ a_{21} & a_{22} & a_{23} \\ a_{31} & a_{32} & a_{33} \end{vmatrix} = m$，求$\begin{vmatrix} 4a_{11} & 2a_{13} - 3a_{11} & -a_{12} \\ 4a_{21} & 2a_{23} - 3a_{21} & -a_{22} \\ 4a_{31} & 2a_{33} - 3a_{31} & -a_{32} \end{vmatrix}$的值。


### 原始文本作答

```html

<p>8m</p>

```


### 公开评语

该题最终结果正确，但未展示任何解题步骤，按宽松标准。最终记6.72分。


## wrong_007 · CALCULATION

学生：student_003；课程：线性代数 · 示例班 002；得分：9.18/10

知识点：未标注


### 题干

解下列方程.

$$\begin{vmatrix}1 & x & x^2 & \cdots & x^{n-1} \\1 & a_1 & a_1^2 & \cdots & a_1^{n-1} \\\vdots & \vdots & \vdots & & \vdots \\1 & a_{n-2} & a_{n-2}^2 & \cdots & a_{n-2}^{n-1} \\1 & a_{n-1} & a_{n-1}^2 & \cdots & a_{n-1}^{n-1}\end{vmatrix}=0，其中a_1,a_2,\cdots,a_{n-1}互不相同.$$


### 原始文本作答

```html

<p>该行列式为范德蒙德行列式</p><p>令D=0，得方程的根为：</p><p>x = a1, a2, ..., an-1</p>

```


### 公开评语

该题核心思路正确，正确识别行列式类型且求解的根正确，仅缺少展开行列式的完整步骤，。最终记9.18分。


## wrong_008 · CALCULATION

学生：student_004；课程：线性代数 · 示例班 002；得分：8.0/10

知识点：向量组的秩、向量组线性无关的定义与判定、向量的线性表示、矩阵的初等列变换


### 题干

已知向量组$A:\alpha_1,\alpha_2$，向量组$B:\alpha_1,\alpha_2,\alpha_3$，向量组$C:\alpha_1,\alpha_2,\alpha_4$的秩依次为$R(A)=R(B)=2$，$R(C)=3$，求$D:\alpha_1,\alpha_2,2\alpha_3 - 3\alpha_4$的秩。


### 原始文本作答

```html

<p>3</p>

```


### 公开评语

本题仅给出正确结果，缺少全部推导步骤，可，待人工核验。最终记8分。


## wrong_009 · CALCULATION

学生：student_004；课程：线性代数 · 示例班 002；得分：8.0/10

知识点：向量组的秩、三阶行列式的计算、向量组线性相关的判定


### 题干

设向量组$\begin{pmatrix}a \\ 3 \\ 1\end{pmatrix}, \begin{pmatrix}2 \\ b \\ 3\end{pmatrix}, \begin{pmatrix}1 \\ 2 \\ 1\end{pmatrix}, \begin{pmatrix}2 \\ 3 \\ 1\end{pmatrix}$的秩为2，求$a,b$的值。


### 原始文本作答

```html

<p>a＝2，b＝5</p>

```


### 公开评语

本题仅给出a、b的正确结果，缺失利用秩的性质推导及行列式计算过程，，待人工核验。最终记8分。


## wrong_010 · CALCULATION

学生：student_005；课程：线性代数 · 示例班 003；得分：8.0/10

知识点：矩阵相似的性质、齐次线性方程组的基础解系求解、施密特正交化方法、特征多项式的计算、向量的单位化


### 题干

设矩阵$A = \begin{pmatrix}1&-2&-4\\-2&x&-2\\-4&-2&1\end{pmatrix}$与$\Lambda = \begin{pmatrix}5&&\\&-4&\\&&y\end{pmatrix}$相似，求$x,y$的值及一个正交矩阵$P$使得$P^{-1}AP = \Lambda$。


### 原始文本作答

```html

<p></p><ol><li><p>x = 4，y = 5</p></li><li><p>正交矩阵P = ⎡ 1/√5 4/3√5 2/3⎤ ⎢-2/√5 2/3√5 1/3⎥ ⎣ 0 -5/3√5 2/3⎦ 满足P⁻¹AP = diag(5, -4, 5)</p></li></ol>

```


### 公开评语

暂无公开评语


## wrong_011 · CALCULATION

学生：student_006；课程：线性代数 · 示例班 004；得分：8.0/10

知识点：线性方程组解的存在性与唯一性、向量的线性表示、三阶行列式的计算、增广矩阵的初等行变换


### 题干

设有向量组$A: \boldsymbol{a_1}=\begin{pmatrix}\alpha \\2 \\10\end{pmatrix}, \boldsymbol{a_2}=\begin{pmatrix}-2 \\1 \\5\end{pmatrix}, \boldsymbol{a_3}=\begin{pmatrix}-1 \\1 \\4\end{pmatrix}$及向量$\boldsymbol{b}=\begin{pmatrix}1 \\\beta \\-1\end{pmatrix}$，问$\alpha$，$\beta$为何值时，

向量$\boldsymbol{b}$能由向量组$A$线性表示，且表示式唯一


### 原始文本作答

```html

<p>α≠-4</p>

```


### 公开评语

过程


## wrong_012 · CALCULATION

学生：student_007；课程：线性代数 · 示例班 005；得分：7.0/10

知识点：向量在基下的坐标、基变换与过渡矩阵、三阶行列式的计算


### 题干

设$\boldsymbol{\alpha_1},\boldsymbol{\alpha_2},\boldsymbol{\alpha_3}$是向量空间$R^3$的一组基，且$\boldsymbol{\beta_1} = 2\boldsymbol{\alpha_1} + 2a\boldsymbol{\alpha_3},\boldsymbol{\beta_2} = 2\boldsymbol{\alpha_2},\boldsymbol{\beta_3} = \boldsymbol{\alpha_1} + (a + 1)\boldsymbol{\alpha_3}.$

当$a$为何值时，存在非零向量$\boldsymbol{x}$在基$\boldsymbol{\alpha_1},\boldsymbol{\alpha_2},\boldsymbol{\alpha_3}$与基$\boldsymbol{\beta_1},\boldsymbol{\beta_2},\boldsymbol{\beta_3}$下的坐标相同，并求出所有非零向量$\boldsymbol{x}$.


### 原始文本作答

```html

<p>0</p>

```


### 公开评语

需要过程


## wrong_013 · CALCULATION

学生：student_008；课程：高等数学A · 示例班 006；得分：1.0/10

知识点：柱坐标下三重积分的计算、第一类换元积分法（凑微分法）、洛必达法则


### 题干

设函数$f(x)$连续，$F(t)=\iiint_V [x^2 + f(x^2 + y^2)]dV$，其中$V: x^2 + y^2 \leq t^2$、$0 \leq z \leq h$；求极限$\lim_{t \to 0} \frac{F(t)}{t}$。


### 原始文本作答

```html

<p>0</p>

```


### 公开评语

本题仅提交正确最终结果，未给出任何解题推导过程，。最终记1分。


## wrong_014 · SINGLE_CHOICE

学生：student_009；课程：高等数学A · 示例班 006；得分：0.0/10

知识点：三重积分的柱面坐标变换、柱面坐标下的体积元、空间曲面的交线与投影


### 题干

设$\Omega$：$x^2 + y^2 + z^2 \leq a^2$、$x^2 + y^2 + z^2 \leq 2az$，则三重积分$\iiint_\Omega f(x,y,z)dV$在柱面坐标下的三次积分为（ ）
[A] $\int_{0}^{2\pi} d\theta\int_{0}^{a} d\rho\int_{0}^{a} f(\rho\cos\theta,\rho\sin\theta,z)\rho dz$
[B] $\int_{0}^{2\pi} d\theta\int_{0}^{\frac{\sqrt{3}}{2}a} d\rho \int_{a}^{\sqrt{a^2-\rho^2}} f(\rho\cos\theta,\rho\sin\theta,z)dz$
[C] $\int_{0}^{2\pi} d\theta\int_{0}^{\frac{\sqrt{3}}{2}a} d\rho \int_{a-\sqrt{a^2-\rho^2}}^{\sqrt{a^2-\rho^2}} f(\rho\cos\theta,\rho\sin\theta,z)\rho dz$
[D] $\int_{0}^{2\pi} d\theta\int_{0}^{\frac{\sqrt{3}}{2}a} d\rho \int_{a-\sqrt{a^2-\rho^2}}^{\sqrt{a^2-\rho^2}} f(\rho\cos\theta,\rho\sin\theta,z)dz$


### 原始文本作答

```text

D

```


### 公开评语

从当前作答看，答案不匹配（标准答案：C，学生答案：D）。当前存在待核验项，需人工确认。最终记0分。


## wrong_015 · SINGLE_CHOICE

学生：student_010；课程：高等数学A · 示例班 006；得分：0.0/10

知识点：三重积分的球面坐标变换、球面坐标的体积元、球面坐标中角度的取值范围


### 题干

设$\Omega: a^2 \leq x^2 + y^2 + z^2 \leq b^2$、$z \geq 0$，则三重积分$\iiint_\Omega f(x,y,z)dV$，在球面坐标下的三次积分为（ ）
[A] $\int_{0}^{2\pi} d\theta \int_{a}^{b} dr \int_{0}^{\sqrt{b^2 - r^2}} f(r\cos\theta, r\sin\theta, z) rdz$
[B] $\int_{0}^{2\pi} d\theta \int_{0}^{\frac{\pi}{2}} d\varphi \int_{a}^{b} f(r\sin\varphi\cos\theta, r\sin\varphi\sin\theta, r\cos\varphi) r^2 \sin\varphi dr$
[C] $\int_{0}^{2\pi} d\theta \int_{0}^{\pi} d\varphi \int_{a}^{b} f(r\sin\varphi\cos\theta, r\sin\varphi\sin\theta, r\cos\varphi) r^2 \sin\varphi dr$
[D] $\int_{0}^{2\pi} d\theta \int_{0}^{\frac{\pi}{2}} d\varphi \int_{a}^{b} f(r\sin\varphi\cos\theta, r\sin\varphi\sin\theta, r\cos\varphi) r^2 \sin\theta dr$


### 原始文本作答

```text

C

```


### 公开评语

从当前作答看，答案不匹配（标准答案：B，学生答案：C）。当前存在待核验项，需人工确认。最终记0分。


## wrong_016 · SINGLE_CHOICE

学生：student_011；课程：高等数学A · 示例班 006；得分：0.0/10

知识点：二重积分的概念与计算、圆的面积公式


### 题干

二重积分 $\iint_{x^2+y^2\leq2} \pi d\sigma = (\quad)$
[A] $\pi$
[B] $2\pi$
[C] $-\pi$
[D] $2\pi^2$


### 原始文本作答

```text

A

```


### 公开评语

从当前作答看，答案不匹配（标准答案：D，学生答案：A）。当前存在待核验项，需人工确认。最终记0分。


## wrong_017 · SINGLE_CHOICE

学生：student_012；课程：高等数学A · 示例班 006；得分：0.0/10

知识点：二重积分的对称性、二重积分的计算、二重积分的线性性质


### 题干

二重积分 $\iint_{x^2+y^2\leq1} (xy +1)d\sigma = (\quad)$
[A] $\pi$
[B] $0$
[C] $-\pi$
[D] $2\pi$


### 原始文本作答

```text

D

```


### 公开评语

从当前作答看，答案不匹配（标准答案：A，学生答案：D）。当前存在待核验项，需人工确认。最终记0分。


## wrong_018 · CALCULATION

学生：student_006；课程：线性代数 · 示例班 004；得分：9.0/10

知识点：向量在基下的坐标、基变换与过渡矩阵、三阶行列式的计算


### 题干

设$\boldsymbol{\alpha_1},\boldsymbol{\alpha_2},\boldsymbol{\alpha_3}$是向量空间$R^3$的一组基，且$\boldsymbol{\beta_1} = 2\boldsymbol{\alpha_1} + 2a\boldsymbol{\alpha_3},\boldsymbol{\beta_2} = 2\boldsymbol{\alpha_2},\boldsymbol{\beta_3} = \boldsymbol{\alpha_1} + (a + 1)\boldsymbol{\alpha_3}.$

当$a$为何值时，存在非零向量$\boldsymbol{x}$在基$\boldsymbol{\alpha_1},\boldsymbol{\alpha_2},\boldsymbol{\alpha_3}$与基$\boldsymbol{\beta_1},\boldsymbol{\beta_2},\boldsymbol{\beta_3}$下的坐标相同，并求出所有非零向量$\boldsymbol{x}$.


### 原始文本作答

```html

<p>a=0；x=k(-α₁+α₃)</p>

```


### 公开评语

过程，且结果错误


## wrong_019 · CALCULATION

学生：student_013；课程：线性代数 · 示例班 004；得分：8.0/10

知识点：线性方程组解的存在性与唯一性、向量的线性表示、三阶行列式的计算、增广矩阵的初等行变换


### 题干

设有向量组$A: \boldsymbol{a_1}=\begin{pmatrix}\alpha \\2 \\10\end{pmatrix}, \boldsymbol{a_2}=\begin{pmatrix}-2 \\1 \\5\end{pmatrix}, \boldsymbol{a_3}=\begin{pmatrix}-1 \\1 \\4\end{pmatrix}$及向量$\boldsymbol{b}=\begin{pmatrix}1 \\\beta \\-1\end{pmatrix}$，问$\alpha$，$\beta$为何值时，

向量$\boldsymbol{b}$能由向量组$A$线性表示，且表示式唯一


### 原始文本作答

```html

<p>当α不等于-4，β为任何值时，</p><p>向量<strong><em>b</em></strong>能由向量组<em>A</em>线性表示，且表示式唯一</p>

```


### 公开评语

过程


## wrong_020 · CALCULATION

学生：student_007；课程：线性代数 · 示例班 005；得分：8.0/10

知识点：向量线性无关的定义、向量组的秩与线性相关性的关系、向量组的线性表示与矩阵乘法的关系、方阵可逆的充要条件、三阶行列式的计算


### 题干

已知 3 维向量组$\boldsymbol{a}_1$，$\boldsymbol{a}_2$，$\boldsymbol{a}_3$线性无关，求向量组$\boldsymbol{a}_1 - \boldsymbol{a}_2$，$\boldsymbol{a}_2 - k\boldsymbol{a}_3$，$\boldsymbol{a}_3 - \boldsymbol{a}_1$线性无关的充分必要条件。


### 原始文本作答

```html

<p>k不等于1</p>

```


### 公开评语

需要过程
