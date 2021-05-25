import sys
# sys.path.append('D:\学习\大三下\编译原理\\courseDesign\\grammar_ana')
import DFA_LR1, getGrammar, firstAndfollow
class LR1table:
    def __init__(self, grammar) -> None:
        self.table = {}
        self.id_value, self.relation = DFA_LR1.DFA_LR1(grammar, firstAndfollow.First(grammar).getFirst()).start()
        self.grammar = grammar
        self.follow = {}
        self.GsNo = []
    
    def init(self):
        for status in self.id_value:
            self.table[status] = {}
        for g in self.grammar:
            for t in self.grammar[g]:
                self.GsNo.append([g, t])
        first = firstAndfollow.First(self.grammar).getFirst()
        self.follow = firstAndfollow.Follow(self.grammar, first).getFollow()

    def statute(self, status, candidate, statute_char, statute_src):
        markedNo = -1
        for i, item in enumerate(self.GsNo):
            if item[1] == candidate and statute_src == item[0]:
                markedNo = i
                break
        for ch in statute_char:
            self.table[status][ch] = 'r'+str(markedNo)

    def print(self):
        for t in self.table:
            print(t, self.table[t])

    def construct(self):
        self.init()
        fNt = list(self.grammar.keys())[0]
        fGe = list(self.grammar.values())[0][0]
        for status in self.id_value:
            for project in self.id_value[status]:
                # for project in projectset:
                if fNt == project[0] and fGe == project[1] and project[2] == 1:
                    self.table[status]['#'] = 'acc'
                else:
                    dotLoca = project[2]
                    if dotLoca < len(project[1]):
                        item = project[1][dotLoca]
                        tar = self.relation[status][item]
                        if item not in self.grammar:
                            self.table[status][item] = tar
                        else:
                            self.table[status][item] = 'gt'+str(tar)
                    else:
                        self.statute(status, project[1], project[3], project[0])
        # self.print()
        return self.table
    
if __name__ == '__main__':
    grammarCon = getGrammar.getGrammar('D:\\学习\\大三下\\编译原理\\courseDesign\\testG38.txt')
    grammar = grammarCon.getContent()
    first = firstAndfollow.First(grammar)
    dfa = DFA_LR1.DFA_LR1(grammar, first.getFirst())
    iv, rela = dfa.start()
    tab = LR1table(rela, iv, grammar)
    tab.construct()