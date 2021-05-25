import sys, json
import firstAndfollow
import getGrammar
class DFA_LR1:
    def __init__(self, grammar, first) -> None:
        self.id_value = dict()
        self.relation = dict()
        self.first = first
        self.grammar = grammar
        self.no = 0

    def init(self):
        self.relation[0] = {}

    def print(self):    #打印DFA
        for p in self.id_value:
            print(p, self.id_value[p])
        # for p in self.relation:
        #     print(p, self.relation[p])

    def intoFile(self, filename):
        with open(filename, 'w') as f:
            json.dump(self.id_value, f)

    def getFirst(self, tf):
        temp = []
        for t in tf:
            if len(t) > 1:
                for i in t:
                    if i not in temp:
                        temp.append(i)
                return temp
            elif t[0] not in self.grammar or t[0] == '#':
                for i in t:
                    if i not in temp:
                        temp.append(i)
                return temp
            else:
                for fir in self.first[t[0]]:
                    if fir not in temp:
                        temp.append(fir)
                if 'ε' not in self.first[t[0]]:
                    return temp

    def Closure(self, Nt, candidate, dotLoca, curPro, ahead):      #进行闭包操作
        temp = []
        tarno = -1      #弧的终点
        flag = False       #是否在同一项目集
        repeat = False
        repeatIV = -1
        temp.append([Nt, candidate, dotLoca, ahead])       #将要求闭包的表达式加入闭包
        # nextChar = ''
        via = ''    #项目集之间的关联符号
        if dotLoca < len(candidate):        #当当前项目有后继项目时，求闭包
            isChange = True
            while isChange:
                isChange = False
                ttemp = temp.copy() 
                for t in ttemp:     #循环求闭包        
                    tempFirst = []        
                    nchar = t[1][t[2]]
                    if nchar in self.grammar:       #期望符是非终结符
                        for c in range(t[2]+1, len(t[1])):
                            tempFirst.append([t[1][c]])
                        tempFirst.append(t[3])
                        # print(candidate, tempFirst)
                        tahead = self.getFirst(tempFirst)
                        for can in self.grammar[nchar]:
                            if [nchar, can, 0, tahead] not in temp:
                                temp.append([nchar, can, 0, tahead])
                                isChange = True 
                ttemp.clear()
        if dotLoca > 0:
            via = candidate[dotLoca-1]
        if curPro in self.relation:     #如果当前项目集在关系字典中，且关联符存在，就将弧连接到已存在的关系中
            if via in self.relation[curPro]:
                flag = True
        for iv in self.id_value:
            isIn = True
            for t in temp:
                if t not in self.id_value[iv]:
                    isIn = False
                    break
            if isIn:
                # print(curPro , 'temp', temp)
                # print(iv, self.id_value[iv], candidate,candidate[dotLoca-1])
                repeat = True
                repeatIV = iv
                break

        # for key in self.id_value:       #判断是否有循环关系
        #     if temp == self.id_value[key]:
        #         tarno = key
        #         break
        if tarno == -1:     #项目集可新增项目
            if flag:
                # print('add', self.relation[curPro][via])
                for t in temp:
                    if t not in self.id_value[self.relation[curPro][via]]:
                        self.id_value[self.relation[curPro][via]].append(t)
            else:
                if repeat:
                    # print('repeat', repeatIV)
                    tarno = repeatIV
                else:
                    # print('new' ,self.no)
                    self.id_value[self.no] = temp.copy()
                    tarno = self.no
                    self.no += 1
        return tarno
        
    
    def move(self, genExp, curPro):     #获取当前项目的后继项目
        Nt = genExp[0]
        candidate = genExp[1]
        dotLoca = genExp[2]
        if dotLoca < len(candidate):
            cno = self.Closure(Nt, candidate, dotLoca+1, curPro, genExp[3])
            return (candidate[dotLoca], cno)
        else:
            return (-1, -1)

    def start(self):
        # print(self.grammar)
        self.Closure(list(self.grammar.keys())[0], list(self.grammar.values())[0][0], 0, 0, ['#'])       #对文法开始符号及产生式求闭包
        # print('init')
        # print(self.id_value[0])
        isChange = True
        while isChange:     #若项目集数量不在增加，则结束
        # count = 0
        # while count < 1:
            tl = self.no   #记录弧的起点
            isChange = False
            for i in range(tl):     #遍历当前项目集的所有产生式
                # print(self.id_value[i])
                for eachcan in self.id_value[i]:
                    if i not in self.relation:
                        self.relation[i] = {}
                    arc, cno = self.move(eachcan, i)
                    if cno != -1:       #如果返回值是-1，则说明当前项目无后继项目
                        if arc not in self.relation[i]:    
                            self.relation[i][arc] = cno
                            isChange = True
            # count += 1
        # self.print()
        # print(self.id_value[7] == self.id_value[2])
        # self.intoFile('jicu.json')
        return (self.id_value, self.relation)
        
if __name__ == '__main__':
    grammarCon = getGrammar.getGrammar('D:\\学习\\大三下\\编译原理\\courseDesign\\testG38.txt')
    grammar = grammarCon.getContent()
    first = firstAndfollow.First(grammar)
    demo = DFA_LR1(grammar, first.getFirst())
    demo.start()