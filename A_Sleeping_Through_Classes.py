t=int(input())
for i in range(t):
    len,k=map(int,input().split())
    s=input()
    flag=0
    ans=0
    counter=0
    
    
    for j in s:
        if j=="0":
            if flag==0:
                ans+=1
            else:
                counter+=1
                if counter>k:
                    ans+=1
                    flag=0


        elif j=="1":
            flag=1
            counter=0
    print(ans)
        

    