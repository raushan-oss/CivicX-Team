n=int(input())
for i in range(n):
    a=int(input())
    l=list(map(int,input().split()))
    if a%2==0 and int(sum(l)/len(l))==l[0]==l[-1]:
        print(0)
    elif a%2!=0 and int(sum(l)/len(l))==l[0]==l[-1]:
        print(2)
    else:
        d={}
        for j in l:
            if j in d.keys():
                d[j]+=1
            else:
                d[j]=1
        c=0
        for k,q in d.items():
            if q%2==0:
                c+=2
            else:
                c+=1
        print(c)
