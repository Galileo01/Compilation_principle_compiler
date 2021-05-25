class getGrammar:
    def __init__(self, filename) -> None:
        self.grammar = {}
        self.filename = filename
    
    def getContent(self):
        fp = open(self.filename, 'r', encoding='utf-8')
        Nont = ''
        while True:
            tempLine = fp.readline()
            if tempLine == '':
                break
            tempLine = tempLine.strip()
            if tempLine[0] != ';':
                if tempLine[0] not in ':|':
                    if tempLine not in self.grammar:
                        self.grammar[tempLine] = []
                    Nont = tempLine
                else:
                    self.addAll(tempLine[1:], Nont)
        return self.grammar

    def print(self):
        for g in self.grammar:
            print(g, self.grammar[g])

    # def getNonter(self):
    #     fp = open(self.filename, 'r', encoding='utf-8')
    #     Nonter = []
    #     while True:
    #         tempLine = fp.readline()
    #         if tempLine == '':
    #             break
    #         if tempLine[0] not in '|;' and len(tempLine)>0:
    #             Nonter.append[tempLine[0]]
    #     return self.grammar


            

    def addAll(self, target, Nont):
        # print(Nont)
        temp = target.split(' ')
        tl = []
        if temp[0] == '':
            temp.pop(0)
        for t in temp:
            tl.append(t)
        self.grammar[Nont].append(tl)

if __name__ == '__main__':
    demo = getGrammar('D:\\学习\\大三下\\编译原理\\文法\\grammer_if_2.txt')
    # demo = getGrammar('D:\\学习\\大三下\\编译原理\\文法\\grammer_if.txt')
    demo.getContent()
    demo.print()