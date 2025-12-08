n=int(input())
for i in range(n):
    a=int(input())
    if a<10:
        print(a)
    else:
        ans=9
        if a<=100:
            print(9+(a//10)+(a//100))
        elif a<=1000:
            print(9+(a//10)+(a//100)+(a//1000))
        else :
            print(9+(a//10)+(a//100)+(a//1000)+(a//10000))