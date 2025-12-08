n=int(input())
for i in range(n):
    a=int(input())
    y,r=map(int,input().split())
    print(min(a,(y//2) + r))