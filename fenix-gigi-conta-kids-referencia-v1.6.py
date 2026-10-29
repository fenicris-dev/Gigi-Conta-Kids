# Referência independente: aritmética racional exata (Fraction), fórmula fechada por ano.
from fractions import Fraction as F
def ref(ini, rate, years, g_init=50, red=3, mn=5, start=3, mx=None, timing='fim'):
    r=F(str(rate))/100; dep=F(str(ini)); bal=F(0); out={}
    for y in range(1,years+1):
        if y>1:
            p=F(g_init)
            if y>=start: p=F(g_init)-red*(y-start+1)
            p=max(p,F(mn))
            if mx is not None: p=min(p,F(mx))
            dep=dep*(1+p/100)
        f=(1+r)**12
        if timing=='fim': bal=bal*f+dep*((f-1)/r if r else 12)
        else: bal=bal*f+dep*(1+r)*((f-1)/r if r else 12)
        out[y]=(bal,dep)
    return out
def tot(ini,years,**k):
    dep=F(str(ini)); s=F(0)
    for y in range(1,years+1):
        if y>1:
            p=F(k.get('g_init',50))
            st=k.get('start',3)
            if y>=st: p=p-k.get('red',3)*(y-st+1)
            p=max(p,F(k.get('mn',5)))
            if k.get('mx') is not None: p=min(p,F(k['mx']))
            dep=dep*(1+p/100)
        s+=12*dep
    return s
for name,kw,hs in [('padrao',dict(ini=25,rate=1,years=30),(10,20,30)),
                   ('alt',dict(ini=100,rate='0.8',years=25,g_init=30,red=2,mn=3,mx=20),(10,25)),
                   ('inicio',dict(ini=50,rate=1.5,years=12,timing='inicio'),(12,))]:
    o=ref(**kw)
    t={h:tot(kw['ini'],h,**{k:v for k,v in kw.items() if k in('g_init','red','mn','start','mx')}) for h in hs}
    for h in hs: print(name,h,float(o[h][0]),float(t[h]),float(o[h][1]))
