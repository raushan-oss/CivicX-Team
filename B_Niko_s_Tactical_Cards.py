n=int(input())
for i in range(n):
    turns=int(input())
    a=list(map(int,input().split()))
    b=list(map(int,input().split()))
    k=0
    for i,j in zip(a,b):
        k+=max(k-i,j-k)
        print(k)
    print(k)
    
